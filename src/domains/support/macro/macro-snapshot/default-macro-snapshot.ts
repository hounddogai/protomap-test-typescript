/**
 * The default macro snapshot records of support's macro work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default macro snapshot is in its life cycle. */
export type DefaultMacroSnapshotStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A default macro snapshot as the macro team keeps it. */
export class DefaultMacroSnapshot {
  code: string;
  name: string;
  journeyId: string;
  archived: boolean;
  updatedAt: number;
  cost: number;
  sendAt: number;
  campaignRef: string;
  visible: boolean;
  status: DefaultMacroSnapshotStatus;

  constructor(
    code: string,
    name: string,
    journeyId: string,
    archived: boolean,
    updatedAt: number,
    cost: number,
    sendAt: number,
    campaignRef: string,
    visible: boolean,
    status: DefaultMacroSnapshotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.journeyId = journeyId;
    this.archived = archived;
    this.updatedAt = updatedAt;
    this.cost = cost;
    this.sendAt = sendAt;
    this.campaignRef = campaignRef;
    this.visible = visible;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultMacroSnapshotStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "cancelled";
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultMacroSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default macro snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedLoad(): number {
    return Math.round((this.cost + this.sendAt) * 100) / 100;
  }

  copy(): DefaultMacroSnapshot {
    return new DefaultMacroSnapshot(
      this.code,
      this.name,
      this.journeyId,
      this.archived,
      this.updatedAt,
      this.cost,
      this.sendAt,
      this.campaignRef,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a default macro snapshot in status planned. */
export function newDefaultMacroSnapshot(code: string, name: string): DefaultMacroSnapshot {
  return new DefaultMacroSnapshot(code, name, "", false, 0, 0, 0, "", false, "planned");
}
