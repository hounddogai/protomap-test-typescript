import * as text from "../../../../kit/text.js";

/** Where a pending complaint bundle is in its life cycle. */
export type PendingComplaintBundleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a pending complaint bundle and its current status. */
export class PendingComplaintBundle {
  code: string;
  name: string;
  label: string;
  journeyId: string;
  channel: string;
  approved: boolean;
  score: number;
  status: PendingComplaintBundleStatus;

  constructor(
    code: string,
    name: string,
    label: string,
    journeyId: string,
    channel: string,
    approved: boolean,
    score: number,
    status: PendingComplaintBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.label = label;
    this.journeyId = journeyId;
    this.channel = channel;
    this.approved = approved;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingComplaintBundleStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingComplaintBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending complaint bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.name}]`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): PendingComplaintBundle {
    return new PendingComplaintBundle(
      this.code,
      this.name,
      this.label,
      this.journeyId,
      this.channel,
      this.approved,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a pending complaint bundle in status proposed. */
export function newPendingComplaintBundle(code: string, name: string): PendingComplaintBundle {
  return new PendingComplaintBundle(code, name, "", "", "", false, 0, "proposed");
}
