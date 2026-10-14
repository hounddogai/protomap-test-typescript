/**
 * The challenge rollup records of loyaltyhub's challenge work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a challenge rollup is in its life cycle. */
export type ChallengeRollupStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a challenge rollup and its current status. */
export class ChallengeRollup {
  code: string;
  name: string;
  country: string;
  label: string;
  weight: number;
  tags: string[];
  description: string;
  sendAt: number;
  utmSource: string;
  visible: boolean;
  graceDays: number;
  status: ChallengeRollupStatus;

  constructor(
    code: string,
    name: string,
    country: string,
    label: string,
    weight: number,
    tags: string[],
    description: string,
    sendAt: number,
    utmSource: string,
    visible: boolean,
    graceDays: number,
    status: ChallengeRollupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.label = label;
    this.weight = weight;
    this.tags = tags;
    this.description = description;
    this.sendAt = sendAt;
    this.utmSource = utmSource;
    this.visible = visible;
    this.graceDays = graceDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ChallengeRollupStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ChallengeRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveVolume(): number {
    return Math.round((this.weight - this.sendAt) * 100) / 100;
  }

  copy(): ChallengeRollup {
    return new ChallengeRollup(
      this.code,
      this.name,
      this.country,
      this.label,
      this.weight,
      this.tags,
      this.description,
      this.sendAt,
      this.utmSource,
      this.visible,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a challenge rollup in status draft. */
export function newChallengeRollup(code: string, name: string): ChallengeRollup {
  return new ChallengeRollup(code, name, "", "", 0, [], "", 0, "", false, 0, "draft");
}
