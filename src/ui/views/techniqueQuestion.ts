import { el } from '../../lib/dom';
import { STYLE_LABEL, STYLE_PARTICIPLE } from '../../music/constants';
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
  { style: 'strum', hint: 'Veel snaren tegelijk, neer en op aangeslagen.', key: 'S' },
  { style: 'pick', hint: 'Eén snaar tegelijk, noot na noot.', key: 'T' },
];

const WHY: Readonly<Record<Style, string>> = {
  strum: 'Je hoort meerdere snaren tegelijk klinken in een snelle veeg, steeds opnieuw in een ritme.',
  pick: 'Je hoort losse noten na elkaar, elk met een eigen duidelijk begin.',
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
  const listenMeta = el('span', { class: 'listen-meta' }, 'Druk op Luister om het fragment te horen.');

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
    label: 'Luister',
    variant: 'big',
    getPlayable: () => ({
      ...arrangeForPlayback(song, { beats: TECHNIQUE_FRAGMENT_BEATS }),
      track: answered ? mixer.trackFor(1) : null,
    }),
    onStart: () => {
      listens += 1;
      listenMeta.textContent = `${listens} keer beluisterd`;
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
      if (style === song.technique) button.append(el('span', { class: 'verdict' }, 'Het goede antwoord'));
    }
    listen.setLabel('Luister opnieuw');
    mixer.setVisible(true);

    const played = STYLE_PARTICIPLE[song.technique];
    explorer = createPatternExplorer(song, { showMixer: false });
    reveal.replaceChildren(
      resultBanner(
        correct ? 'good' : 'bad',
        correct,
        correct ? `Ja! Hier werd ${played}.` : `Net niet. Hier werd ${played}.`,
        WHY[song.technique],
      ),
      songMeta(song),
      mixer.node,
      el('details', { class: 'learn', open: !correct }, el('summary', {}, 'Bekijk het patroon'), explorer.node),
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
    el('h2', { class: 'q-title', id: 'q-title' }, 'Wordt deze gitaar geslagen of getokkeld?'),
    el('p', { class: 'q-help' }, 'Luister zo vaak als je wilt en kies dan.'),
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
