import * as text from "../../../../kit/text.js";

/** Where a wait template is in its life cycle. */
export type WaitTemplateStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One wait template, with what the planners need to act on it. */
export class WaitTemplate {
  code: string;
  title: string;
  cost: number;
  active: boolean;
  name: string;
  source: string;
  checksum: string;
  journeyId: string;
  status: WaitTemplateStatus;

  constructor(
    code: string,
    title: string,
    cost: number,
    active: boolean,
    name: string,
    source: string,
    checksum: string,
    journeyId: string,
    status: WaitTemplateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cost = cost;
    this.active = active;
    this.name = name;
    this.source = source;
    this.checksum = checksum;
    this.journeyId = journeyId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: WaitTemplateStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WaitTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.cost;
  }

  copy(): WaitTemplate {
    return new WaitTemplate(
      this.code,
      this.title,
      this.cost,
      this.active,
      this.name,
      this.source,
      this.checksum,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a wait template in status draft. */
export function newWaitTemplate(code: string, title: string): WaitTemplate {
  return new WaitTemplate(code, title, 0, false, "", "", "", "", "draft");
}
