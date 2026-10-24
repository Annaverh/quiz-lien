import { el } from '../../lib/dom';
import { STYLE_LABEL } from '../../music/constants';
import type { Song, Style } from '../../music/types';
import { TECHNIQUE_FRAGMENT_BEATS } from '../../quiz/modes';
import type { Round } from '../../quiz/round';
import { arrangeForPlayback } from '../../tracks/timing';
import { onKeys } from '../components/keyboard';
import { createPatternExplorer } from '../components/patternExplorer';
import { createPlayButton } from '../components/playButton';
import { songMeta } from '../components/songMeta';
import { createTrackMixer } from '../components/trackMixer';
import type { AppActions, View } from '../types';
import { nextButton, questionKicker, resultBanner } from './question';

const ANSWERS: readonly { style: Style; hint: string; key: string }[] = [
  { style: 'strum', hint: 'Many strings at once, brushed down and up.', key: 'S' },
  { style: 'pick', hint: 'One string at a time, note after note.', key: 'P' },
];

const WHY: Readonly<Record<Style, string>> = {
  strum: 'You can hear several strings hit together in a quick sweep, over and over in a rhythm.',
  pick: 'You can hear single notes one after another, each with its own clear start.',
};

export function techniqueQuestionView(app: AppActions, round: Round, song: Song): View {
  let listens = 0;
  let answered = false;
  let explorer: View | null = null;
  // Hidden until the answer is in: the recording would give the song away.
  const mixer = createTrackMixer(song, { visible: false });

  const eq = el(
    'span',
    { class: 'eq', 'aria-hidden': 'true' },
    Array.from({ length: 5 }, () => el('i')),
  );
  const listenMeta = el('span', { class: 'listen-meta' }, 'Press play to hear the fragment.');

  const answerButtons = new Map(
    ANSWERS.map(({ style, hint, key }) => [
      style,
      el(
        'button',
        { type: 'button', class: `answer-btn ${style}`, disabled: true, onClick: () => answer(style) },
        el('strong', {}, STYLE_LABEL[style]),
        el('span', {}, hint),
        el('kbd', {}, key),
      ),
    ]),
  );

  const listen = createPlayButton({
    label: 'Listen',
    variant: 'big',
    getPlayable: () => ({
      ...arrangeForPlayback(song, { beats: TECHNIQUE_FRAGMENT_BEATS }),
      track: answered ? mixer.trackFor(1) : null,
    }),
    onStart: () => {
      listens += 1;
      listenMeta.textContent = `Heard ${listens} ${listens === 1 ? 'time' : 'times'}`;
      if (!answered) for (const button of answerButtons.values()) button.disabled = false;
    },
    onStep: info => eq.classList.toggle('is-live', info !== null),
  });

  const reveal = el('div', { class: 'reveal', hidden: true });

  function answer(choice: Style): void {
    if (answered) return;
    answered = true;
    const correct = choice === song.technique;
    round.record({ correct, detail: { kind: 'technique', choice } });
    app.refreshTopbar();

    for (const [style, button] of answerButtons) {
      button.disabled = true;
      button.classList.toggle('is-chosen', style === choice);
      button.classList.toggle('is-dim', style !== choice && style !== song.technique);
      if (style === song.technique) button.append(el('span', { class: 'verdict' }, 'Right answer'));
    }
    listen.setLabel('Listen again');
    mixer.setVisible(true);

    const real = STYLE_LABEL[song.technique].toLowerCase();
    explorer = createPatternExplorer(song, { showMixer: false });
    reveal.replaceChildren(
      resultBanner(
        correct ? 'good' : 'bad',
        correct,
        correct ? `Yes! That was ${real}.` : `Not quite. That was ${real}.`,
        WHY[song.technique],
      ),
      songMeta(song),
      mixer.node,
      el(
        'details',
        { class: 'learn', open: !correct },
        el('summary', {}, `Show me the ${real} pattern`),
        explorer.node,
      ),
      el('div', { class: 'action-row' }, el('span', { class: 'spacer' }), nextButton(app, round)),
    );
    reveal.hidden = false;
  }

  const removeKeys = onKeys(event => {
    const key = event.key.toLowerCase();
    const style = ANSWERS.find(a => a.key.toLowerCase() === key)?.style;
    if (style && !answerButtons.get(style)?.disabled) answer(style);
  });

  const node = el(
    'section',
    { class: 'card', 'aria-labelledby': 'q-title' },
    questionKicker(round, 'technique'),
    el('h2', { class: 'q-title', id: 'q-title' }, 'Is this guitar strummed or picked?'),
    el('p', { class: 'q-help' }, 'Listen to the fragment as often as you like, then choose.'),
    el('div', { class: 'listen-row' }, listen.node, eq, listenMeta),
    el('div', { class: 'answers' }, [...answerButtons.values()]),
    reveal,
  );

  return {
    node,
    destroy() {
      removeKeys();
      listen.stop();
      mixer.destroy();
      explorer?.destroy?.();
    },
  };
}
