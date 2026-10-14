import * as text from "../../../../kit/text.js";

/** Where a default proof window is in its life cycle. */
export type DefaultProofWindowStatus = "new" | "queued" | "running" | "done" | "failed";

/** A default proof window as the proof team keeps it. */
export class DefaultProofWindow {
  code: string;
  name: string;
  sendAt: number;
  contactEmail: string;
  description: string;
  sequence: number;
  audienceId: string;
  clicks: number;
  utmSource: string;
  windowDays: number;
  status: DefaultProofWindowStatus;

  constructor(
    code: string,
    name: string,
    sendAt: number,
    contactEmail: string,
    description: string,
    sequence: number,
    audienceId: string,
    clicks: number,
    utmSource: string,
    windowDays: number,
    status: DefaultProofWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.sendAt = sendAt;
    this.contactEmail = contactEmail;
    this.description = description;
    this.sequence = sequence;
    this.audienceId = audienceId;
    this.clicks = clicks;
    this.utmSource = utmSource;
    this.windowDays = windowDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultProofWindowStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        return next === "running" || next === "done";
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultProofWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default proof window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedValue(): number {
    return Math.round((this.sendAt - this.clicks) * 100) / 100;
  }

  copy(): DefaultProofWindow {
    return new DefaultProofWindow(
      this.code,
      this.name,
      this.sendAt,
      this.contactEmail,
      this.description,
      this.sequence,
      this.audienceId,
      this.clicks,
      this.utmSource,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a default proof window in status new. */
export function newDefaultProofWindow(code: string, name: string): DefaultProofWindow {
  return new DefaultProofWindow(code, name, 0, "", "", 0, "", 0, "", 0, "new");
}
