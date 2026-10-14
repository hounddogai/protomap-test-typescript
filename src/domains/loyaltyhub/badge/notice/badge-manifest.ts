import * as text from "../../../../kit/text.js";

/** Where a badge manifest is in its life cycle. */
export type BadgeManifestStatus = "new" | "queued" | "running" | "done" | "failed";

/** One badge manifest, with what the planners need to act on it. */
export class BadgeManifest {
  code: string;
  name: string;
  channel: string;
  approved: boolean;
  sequence: number;
  status: BadgeManifestStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    approved: boolean,
    sequence: number,
    status: BadgeManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.approved = approved;
    this.sequence = sequence;
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

  canMoveTo(next: BadgeManifestStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "done";
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

  moveTo(next: BadgeManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`badge manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"badge manifest"} ${this.code}`;
  }

  measuredValue(): number {
    return this.sequence;
  }

  copy(): BadgeManifest {
    return new BadgeManifest(this.code, this.name, this.channel, this.approved, this.sequence, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a badge manifest in status new. */
export function newBadgeManifest(code: string, name: string): BadgeManifest {
  return new BadgeManifest(code, name, "", false, 0, "new");
}
