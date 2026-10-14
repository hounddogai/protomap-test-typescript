/**
 * The global creative group records of adops's creative work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global creative group is in its life cycle. */
export type GlobalCreativeGroupStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One global creative group, with what the planners need to act on it. */
export class GlobalCreativeGroup {
  code: string;
  title: string;
  startsAt: number;
  description: string;
  name: string;
  ownerId: string;
  status: GlobalCreativeGroupStatus;

  constructor(
    code: string,
    title: string,
    startsAt: number,
    description: string,
    name: string,
    ownerId: string,
    status: GlobalCreativeGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.startsAt = startsAt;
    this.description = description;
    this.name = name;
    this.ownerId = ownerId;
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

  canMoveTo(next: GlobalCreativeGroupStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalCreativeGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global creative group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  measuredValue(): number {
    return this.startsAt;
  }

  copy(): GlobalCreativeGroup {
    return new GlobalCreativeGroup(
      this.code,
      this.title,
      this.startsAt,
      this.description,
      this.name,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a global creative group in status idle. */
export function newGlobalCreativeGroup(code: string, title: string): GlobalCreativeGroup {
  return new GlobalCreativeGroup(code, title, 0, "", "", "", "idle");
}
