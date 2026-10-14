/**
 * The manual preference segment records of consentcenter's preference work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual preference segment is in its life cycle. */
export type ManualPreferenceSegmentStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A manual preference segment. Its code is unique within a tenant. */
export class ManualPreferenceSegment {
  code: string;
  label: string;
  startsAt: number;
  maximum: number;
  approved: boolean;
  name: string;
  notes: string;
  attributes: Map<string, string>;
  audienceId: string;
  archived: boolean;
  description: string;
  status: ManualPreferenceSegmentStatus;

  constructor(
    code: string,
    label: string,
    startsAt: number,
    maximum: number,
    approved: boolean,
    name: string,
    notes: string,
    attributes: Map<string, string>,
    audienceId: string,
    archived: boolean,
    description: string,
    status: ManualPreferenceSegmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.startsAt = startsAt;
    this.maximum = maximum;
    this.approved = approved;
    this.name = name;
    this.notes = notes;
    this.attributes = attributes;
    this.audienceId = audienceId;
    this.archived = archived;
    this.description = description;
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

  canMoveTo(next: ManualPreferenceSegmentStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
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

  moveTo(next: ManualPreferenceSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual preference segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netTotal(): number {
    return Math.round((this.maximum - this.startsAt) * 100) / 100;
  }

  copy(): ManualPreferenceSegment {
    return new ManualPreferenceSegment(
      this.code,
      this.label,
      this.startsAt,
      this.maximum,
      this.approved,
      this.name,
      this.notes,
      this.attributes,
      this.audienceId,
      this.archived,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a manual preference segment in status idle. */
export function newManualPreferenceSegment(code: string, label: string): ManualPreferenceSegment {
  return new ManualPreferenceSegment(
    code,
    label,
    0,
    0,
    false,
    "",
    "",
    new Map<string, string>(),
    "",
    false,
    "",
    "idle",
  );
}
