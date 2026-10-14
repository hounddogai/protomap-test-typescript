import * as text from "../../../../kit/text.js";

/** Where a rolling insight snapshot is in its life cycle. */
export type RollingInsightSnapshotStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One rolling insight snapshot, with what the planners need to act on it. */
export class RollingInsightSnapshot {
  code: string;
  name: string;
  ratio: number;
  archived: boolean;
  visible: boolean;
  ceiling: number;
  clicks: number;
  weight: number;
  utmSource: string;
  ownerId: string;
  attributes: Map<string, string>;
  status: RollingInsightSnapshotStatus;

  constructor(
    code: string,
    name: string,
    ratio: number,
    archived: boolean,
    visible: boolean,
    ceiling: number,
    clicks: number,
    weight: number,
    utmSource: string,
    ownerId: string,
    attributes: Map<string, string>,
    status: RollingInsightSnapshotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ratio = ratio;
    this.archived = archived;
    this.visible = visible;
    this.ceiling = ceiling;
    this.clicks = clicks;
    this.weight = weight;
    this.utmSource = utmSource;
    this.ownerId = ownerId;
    this.attributes = attributes;
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

  canMoveTo(next: RollingInsightSnapshotStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: RollingInsightSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling insight snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveValue(): number {
    return Math.round(this.weight * this.ratio * 100) / 100;
  }

  copy(): RollingInsightSnapshot {
    return new RollingInsightSnapshot(
      this.code,
      this.name,
      this.ratio,
      this.archived,
      this.visible,
      this.ceiling,
      this.clicks,
      this.weight,
      this.utmSource,
      this.ownerId,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a rolling insight snapshot in status planned. */
export function newRollingInsightSnapshot(code: string, name: string): RollingInsightSnapshot {
  return new RollingInsightSnapshot(code, name, 0, false, false, 0, 0, 0, "", "", new Map<string, string>(), "planned");
}
