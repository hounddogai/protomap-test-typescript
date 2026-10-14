/**
 * The creative proposal records of adops's creative work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a creative proposal is in its life cycle. */
export type CreativeProposalStatus = "new" | "queued" | "running" | "done" | "failed";

/** One creative proposal, with what the planners need to act on it. */
export class CreativeProposal {
  code: string;
  name: string;
  timezone: string;
  utmSource: string;
  region: string;
  channel: string;
  score: number;
  status: CreativeProposalStatus;

  constructor(
    code: string,
    name: string,
    timezone: string,
    utmSource: string,
    region: string,
    channel: string,
    score: number,
    status: CreativeProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.timezone = timezone;
    this.utmSource = utmSource;
    this.region = region;
    this.channel = channel;
    this.score = score;
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

  canMoveTo(next: CreativeProposalStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
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

  moveTo(next: CreativeProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"creative proposal"} ${this.code}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): CreativeProposal {
    return new CreativeProposal(
      this.code,
      this.name,
      this.timezone,
      this.utmSource,
      this.region,
      this.channel,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a creative proposal in status new. */
export function newCreativeProposal(code: string, name: string): CreativeProposal {
  return new CreativeProposal(code, name, "", "", "", "", 0, "new");
}
