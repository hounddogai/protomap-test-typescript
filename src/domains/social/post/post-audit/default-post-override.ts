import * as text from "../../../../kit/text.js";

/** Where a default post override is in its life cycle. */
export type DefaultPostOverrideStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a default post override and its current status. */
export class DefaultPostOverride {
  code: string;
  title: string;
  variant: string;
  tags: string[];
  summary: string;
  locale: string;
  openRate: number;
  status: DefaultPostOverrideStatus;

  constructor(
    code: string,
    title: string,
    variant: string,
    tags: string[],
    summary: string,
    locale: string,
    openRate: number,
    status: DefaultPostOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.variant = variant;
    this.tags = tags;
    this.summary = summary;
    this.locale = locale;
    this.openRate = openRate;
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

  canMoveTo(next: DefaultPostOverrideStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: DefaultPostOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default post override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
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

  copy(): DefaultPostOverride {
    return new DefaultPostOverride(
      this.code,
      this.title,
      this.variant,
      this.tags,
      this.summary,
      this.locale,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a default post override in status planned. */
export function newDefaultPostOverride(code: string, title: string): DefaultPostOverride {
  return new DefaultPostOverride(code, title, "", [], "", "", 0, "planned");
}
