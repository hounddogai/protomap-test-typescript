/**
 * The deflection snapshot records of support's deflection work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a deflection snapshot is in its life cycle. */
export type DeflectionSnapshotStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One deflection snapshot, with what the planners need to act on it. */
export class DeflectionSnapshot {
  code: string;
  title: string;
  windowDays: number;
  active: boolean;
  createdAt: number;
  utmSource: string;
  attributes: Map<string, string>;
  pinned: boolean;
  name: string;
  status: DeflectionSnapshotStatus;

  constructor(
    code: string,
    title: string,
    windowDays: number,
    active: boolean,
    createdAt: number,
    utmSource: string,
    attributes: Map<string, string>,
    pinned: boolean,
    name: string,
    status: DeflectionSnapshotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.active = active;
    this.createdAt = createdAt;
    this.utmSource = utmSource;
    this.attributes = attributes;
    this.pinned = pinned;
    this.name = name;
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

  canMoveTo(next: DeflectionSnapshotStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DeflectionSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedExposure(): number {
    return Math.round((this.windowDays + this.createdAt) * 100) / 100;
  }

  copy(): DeflectionSnapshot {
    return new DeflectionSnapshot(
      this.code,
      this.title,
      this.windowDays,
      this.active,
      this.createdAt,
      this.utmSource,
      this.attributes,
      this.pinned,
      this.name,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a deflection snapshot in status planned. */
export function newDeflectionSnapshot(code: string, title: string): DeflectionSnapshot {
  return new DeflectionSnapshot(code, title, 0, false, 0, "", new Map<string, string>(), false, "", "planned");
}
