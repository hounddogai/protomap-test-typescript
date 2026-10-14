import * as text from "../../../../kit/text.js";

/** Where a default ticket view notice is in its life cycle. */
export type DefaultTicketViewNoticeStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One default ticket view notice, with what the planners need to act on it. */
export class DefaultTicketViewNotice {
  code: string;
  name: string;
  checksum: string;
  ceiling: number;
  ratio: number;
  budget: number;
  status: DefaultTicketViewNoticeStatus;

  constructor(
    code: string,
    name: string,
    checksum: string,
    ceiling: number,
    ratio: number,
    budget: number,
    status: DefaultTicketViewNoticeStatus,
  ) {
    this.code = code;
    this.name = name;
    this.checksum = checksum;
    this.ceiling = ceiling;
    this.ratio = ratio;
    this.budget = budget;
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

  canMoveTo(next: DefaultTicketViewNoticeStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultTicketViewNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default ticket view notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netTotal(): number {
    return Math.round((this.ceiling + this.ratio) * 100) / 100;
  }

  copy(): DefaultTicketViewNotice {
    return new DefaultTicketViewNotice(
      this.code,
      this.name,
      this.checksum,
      this.ceiling,
      this.ratio,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a default ticket view notice in status open. */
export function newDefaultTicketViewNotice(code: string, name: string): DefaultTicketViewNotice {
  return new DefaultTicketViewNotice(code, name, "", 0, 0, 0, "open");
}
