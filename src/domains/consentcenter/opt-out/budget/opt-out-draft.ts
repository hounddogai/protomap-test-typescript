import * as text from "../../../../kit/text.js";

/** Where a opt out draft is in its life cycle. */
export type OptOutDraftStatus = "requested" | "granted" | "revoked" | "expired";

/** A opt out draft as the opt out team keeps it. */
export class OptOutDraft {
  code: string;
  label: string;
  source: string;
  ratio: number;
  channel: string;
  status: OptOutDraftStatus;

  constructor(
    code: string,
    label: string,
    source: string,
    ratio: number,
    channel: string,
    status: OptOutDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.source = source;
    this.ratio = ratio;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: OptOutDraftStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: OptOutDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  measuredValue(): number {
    return this.ratio;
  }

  copy(): OptOutDraft {
    return new OptOutDraft(this.code, this.label, this.source, this.ratio, this.channel, this.status);
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a opt out draft in status requested. */
export function newOptOutDraft(code: string, label: string): OptOutDraft {
  return new OptOutDraft(code, label, "", 0, "", "requested");
}
