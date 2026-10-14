import * as text from "../../../../kit/text.js";

/** Where a pending ticket view audit is in its life cycle. */
export type PendingTicketViewAuditStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A pending ticket view audit as the ticket view team keeps it. */
export class PendingTicketViewAudit {
  code: string;
  label: string;
  budget: number;
  externalRef: string;
  unit: string;
  ratio: number;
  score: number;
  channel: string;
  audienceId: string;
  status: PendingTicketViewAuditStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    externalRef: string,
    unit: string,
    ratio: number,
    score: number,
    channel: string,
    audienceId: string,
    status: PendingTicketViewAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.externalRef = externalRef;
    this.unit = unit;
    this.ratio = ratio;
    this.score = score;
    this.channel = channel;
    this.audienceId = audienceId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingTicketViewAuditStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingTicketViewAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending ticket view audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedLoad(): number {
    return Math.round(this.ratio * this.score * 100) / 100;
  }

  copy(): PendingTicketViewAudit {
    return new PendingTicketViewAudit(
      this.code,
      this.label,
      this.budget,
      this.externalRef,
      this.unit,
      this.ratio,
      this.score,
      this.channel,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a pending ticket view audit in status idle. */
export function newPendingTicketViewAudit(code: string, label: string): PendingTicketViewAudit {
  return new PendingTicketViewAudit(code, label, 0, "", "", 0, 0, "", "", "idle");
}
