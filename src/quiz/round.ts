import type { Style } from '../music/types';
import type { Mode } from './modes';
import type { Question } from './questions';
import type { ChangeResult } from './scoring';

export type AnswerDetail =
  { kind: 'technique'; choice: Style } | { kind: 'changes'; marks: number[]; result: ChangeResult };

export interface Answer {
  correct: boolean;
  detail: AnswerDetail;
}

/** One quiz round: the questions, the answers so far and the current streak. */
export class Round {
  readonly mode: Mode;
  readonly questions: readonly Question[];
  readonly #answers: (Answer | undefined)[] = [];
  #index = 0;
  #streak = 0;

  constructor(mode: Mode, questions: readonly Question[]) {
    if (!questions.length) throw new RangeError('A round needs at least one question');
    this.mode = mode;
    this.questions = questions;
  }

  get index(): number {
    return this.#index;
  }

  get current(): Question {
    return this.questions[this.#index] as Question;
  }

  get isFinished(): boolean {
    return this.#index >= this.questions.length;
  }

  get isLast(): boolean {
    return this.#index === this.questions.length - 1;
  }

  get score(): number {
    return this.#answers.filter(a => a?.correct).length;
  }

  get streak(): number {
    return this.#streak;
  }

  answerAt(index: number): Answer | undefined {
    return this.#answers[index];
  }

  record(answer: Answer): void {
    if (this.isFinished) throw new Error('The round is already finished');
    if (this.#answers[this.#index]) return;
    this.#answers[this.#index] = answer;
    this.#streak = answer.correct ? this.#streak + 1 : 0;
  }

  advance(): void {
    if (!this.isFinished) this.#index += 1;
  }
}
