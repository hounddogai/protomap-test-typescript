import * as text from "../../../../kit/text.js";

/** Where a default warmup assignment is in its life cycle. */
export type DefaultWarmupAssignmentStatus = "requested" | "granted" | "revoked" | "expired";

/** A default warmup assignment as the warmup team keeps it. */
export class DefaultWarmupAssignment {
  code: string;
  title: string;
  openRate: number;
  tags: string[];
  label: string;
  journeyId: string;
  status: DefaultWarmupAssignmentStatus;

  constructor(
    code: string,
    title: string,
    openRate: number,
    tags: string[],
    label: string,
    journeyId: string,
    status: DefaultWarmupAssignmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.openRate = openRate;
    this.tags = tags;
    this.label = label;
    this.journeyId = journeyId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultWarmupAssignmentStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: DefaultWarmupAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default warmup assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.openRate;
  }

  copy(): DefaultWarmupAssignment {
    return new DefaultWarmupAssignment(
      this.code,
      this.title,
      this.openRate,
      this.tags,
      this.label,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a default warmup assignment in status requested. */
export function newDefaultWarmupAssignment(code: string, title: string): DefaultWarmupAssignment {
  return new DefaultWarmupAssignment(code, title, 0, [], "", "", "requested");
}
