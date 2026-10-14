import * as text from "../../../../kit/text.js";

/** Where a global preference bundle is in its life cycle. */
export type GlobalPreferenceBundleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A global preference bundle. Its code is unique within a tenant. */
export class GlobalPreferenceBundle {
  code: string;
  label: string;
  pinned: boolean;
  utmSource: string;
  channel: string;
  segment: string;
  quantity: number;
  audienceId: string;
  graceDays: number;
  tags: string[];
  status: GlobalPreferenceBundleStatus;

  constructor(
    code: string,
    label: string,
    pinned: boolean,
    utmSource: string,
    channel: string,
    segment: string,
    quantity: number,
    audienceId: string,
    graceDays: number,
    tags: string[],
    status: GlobalPreferenceBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.pinned = pinned;
    this.utmSource = utmSource;
    this.channel = channel;
    this.segment = segment;
    this.quantity = quantity;
    this.audienceId = audienceId;
    this.graceDays = graceDays;
    this.tags = tags;
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

  canMoveTo(next: GlobalPreferenceBundleStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: GlobalPreferenceBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global preference bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedTotal(): number {
    return Math.round(this.quantity * this.graceDays * 100) / 100;
  }

  copy(): GlobalPreferenceBundle {
    return new GlobalPreferenceBundle(
      this.code,
      this.label,
      this.pinned,
      this.utmSource,
      this.channel,
      this.segment,
      this.quantity,
      this.audienceId,
      this.graceDays,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a global preference bundle in status planned. */
export function newGlobalPreferenceBundle(code: string, label: string): GlobalPreferenceBundle {
  return new GlobalPreferenceBundle(code, label, false, "", "", "", 0, "", 0, [], "planned");
}
