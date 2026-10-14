import * as text from "../../../../kit/text.js";

/** Where a lenient proof target is in its life cycle. */
export type LenientProofTargetStatus = "created" | "validated" | "published" | "retired";

/** One lenient proof target, with what the planners need to act on it. */
export class LenientProofTarget {
  code: string;
  title: string;
  summary: string;
  channel: string;
  ownerId: string;
  version: number;
  status: LenientProofTargetStatus;

  constructor(
    code: string,
    title: string,
    summary: string,
    channel: string,
    ownerId: string,
    version: number,
    status: LenientProofTargetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.summary = summary;
    this.channel = channel;
    this.ownerId = ownerId;
    this.version = version;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientProofTargetStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientProofTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient proof target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"lenient proof target"} ${this.code}`;
  }

  measuredValue(): number {
    return this.version;
  }

  copy(): LenientProofTarget {
    return new LenientProofTarget(
      this.code,
      this.title,
      this.summary,
      this.channel,
      this.ownerId,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a lenient proof target in status created. */
export function newLenientProofTarget(code: string, title: string): LenientProofTarget {
  return new LenientProofTarget(code, title, "", "", "", 0, "created");
}
