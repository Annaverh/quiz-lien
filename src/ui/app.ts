import { engine } from '../audio/engine';
import type { Song } from '../music/types';
import type { Mode } from '../quiz/modes';
import { buildQuestions } from '../quiz/questions';
import { Round } from '../quiz/round';
import { saveRound } from '../quiz/stats';
import { renderTopbar } from './topbar';
import type { AppActions, View } from './types';
import { changesQuestionView } from './views/changesQuestion';
import { homeView } from './views/home';
import { studyView } from './views/study';
import { summaryView } from './views/summary';
import { techniqueQuestionView } from './views/techniqueQuestion';

/** Owns navigation: one view at a time, and the round in progress (if any). */
export class App implements AppActions {
  readonly #topbar: HTMLElement;
  readonly #main: HTMLElement;
  readonly #songs: readonly Song[];
  #view: View | null = null;
  #round: Round | null = null;

  constructor({ topbar, main, songs }: { topbar: HTMLElement; main: HTMLElement; songs: readonly Song[] }) {
    this.#topbar = topbar;
    this.#main = main;
    this.#songs = songs;
  }

  get round(): Round | null {
    return this.#round;
  }

  goHome(): void {
    this.#round = null;
    this.#show(homeView(this, this.#songs));
  }

  startRound(mode: Mode): void {
    this.#round = new Round(mode, buildQuestions(mode, this.#songs));
    this.#showQuestion(this.#round);
  }

  nextQuestion(): void {
    const round = this.#round;
    if (!round) return;
    if (round.isLast) {
      const isBest = saveRound(round);
      round.advance();
      this.#show(summaryView(this, round, isBest));
      return;
    }
    round.advance();
    this.#showQuestion(round);
  }

  study(song: Song): void {
    this.#round = null;
    this.#show(studyView(this, song));
  }

  refreshTopbar(): void {
    renderTopbar(this.#topbar, this.#round, () => this.goHome());
  }

  #showQuestion(round: Round): void {
    const { kind, song } = round.current;
    this.#show(
      kind === 'technique' ? techniqueQuestionView(this, round, song) : changesQuestionView(this, round, song),
    );
  }

  #show(view: View): void {
    this.#view?.destroy?.();
    engine.stop();
    this.#view = view;
    this.refreshTopbar();
    this.#main.replaceChildren(view.node);
    window.scrollTo({ top: 0 });
    this.#main.focus({ preventScroll: true });
  }
}
