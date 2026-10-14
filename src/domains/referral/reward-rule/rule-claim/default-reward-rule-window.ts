import * as text from "../../../../kit/text.js";

/** Where a default reward rule window is in its life cycle. */
export type DefaultRewardRuleWindowStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A default reward rule window as the reward rule team keeps it. */
export class DefaultRewardRuleWindow {
  code: string;
  title: string;
  maximum: number;
  pinned: boolean;
  attempts: number;
  status: DefaultRewardRuleWindowStatus;

  constructor(
    code: string,
    title: string,
    maximum: number,
    pinned: boolean,
    attempts: number,
    status: DefaultRewardRuleWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.maximum = maximum;
    this.pinned = pinned;
    this.attempts = attempts;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultRewardRuleWindowStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "archived";
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: DefaultRewardRuleWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default reward rule window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"default reward rule window"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round(this.attempts * this.maximum * 100) / 100;
  }

  copy(): DefaultRewardRuleWindow {
    return new DefaultRewardRuleWindow(this.code, this.title, this.maximum, this.pinned, this.attempts, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a default reward rule window in status open. */
export function newDefaultRewardRuleWindow(code: string, title: string): DefaultRewardRuleWindow {
  return new DefaultRewardRuleWindow(code, title, 0, false, 0, "open");
}
