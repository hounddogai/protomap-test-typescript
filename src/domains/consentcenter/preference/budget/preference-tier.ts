import * as text from "../../../../kit/text.js";

/** Where a preference tier is in its life cycle. */
export type PreferenceTierStatus = "created" | "validated" | "published" | "retired";

/** The record of a preference tier and its current status. */
export class PreferenceTier {
  code: string;
  label: string;
  startsAt: number;
  revision: number;
  tags: string[];
  ratio: number;
  windowDays: number;
  segment: string;
  ownerId: string;
  status: PreferenceTierStatus;

  constructor(
    code: string,
    label: string,
    startsAt: number,
    revision: number,
    tags: string[],
    ratio: number,
    windowDays: number,
    segment: string,
    ownerId: string,
    status: PreferenceTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.startsAt = startsAt;
    this.revision = revision;
    this.tags = tags;
    this.ratio = ratio;
    this.windowDays = windowDays;
    this.segment = segment;
    this.ownerId = ownerId;
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

  canMoveTo(next: PreferenceTierStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PreferenceTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`preference tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netVolume(): number {
    return Math.round((this.windowDays - this.startsAt) * 100) / 100;
  }

  copy(): PreferenceTier {
    return new PreferenceTier(
      this.code,
      this.label,
      this.startsAt,
      this.revision,
      this.tags,
      this.ratio,
      this.windowDays,
      this.segment,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a preference tier in status created. */
export function newPreferenceTier(code: string, label: string): PreferenceTier {
  return new PreferenceTier(code, label, 0, 0, [], 0, 0, "", "", "created");
}
