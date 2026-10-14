import * as text from "../../../../kit/text.js";

/** Where a challenge checkpoint is in its life cycle. */
export type ChallengeCheckpointStatus = "created" | "validated" | "published" | "retired";

/** A challenge checkpoint as the challenge team keeps it. */
export class ChallengeCheckpoint {
  code: string;
  title: string;
  campaignRef: string;
  visible: boolean;
  minimum: number;
  status: ChallengeCheckpointStatus;

  constructor(
    code: string,
    title: string,
    campaignRef: string,
    visible: boolean,
    minimum: number,
    status: ChallengeCheckpointStatus,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRef = campaignRef;
    this.visible = visible;
    this.minimum = minimum;
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

  canMoveTo(next: ChallengeCheckpointStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ChallengeCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  measuredValue(): number {
    return this.minimum;
  }

  copy(): ChallengeCheckpoint {
    return new ChallengeCheckpoint(this.code, this.title, this.campaignRef, this.visible, this.minimum, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a challenge checkpoint in status created. */
export function newChallengeCheckpoint(code: string, title: string): ChallengeCheckpoint {
  return new ChallengeCheckpoint(code, title, "", false, 0, "created");
}
