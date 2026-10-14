/**
 * The legacy model draft records of attribution's model work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy model draft is in its life cycle. */
export type LegacyModelDraftStatus = "created" | "validated" | "published" | "retired";

/** A legacy model draft as the model team keeps it. */
export class LegacyModelDraft {
  code: string;
  title: string;
  durationMinutes: number;
  label: string;
  budget: number;
  frequencyCap: number;
  category: string;
  tags: string[];
  locale: string;
  clicks: number;
  batchSize: number;
  status: LegacyModelDraftStatus;

  constructor(
    code: string,
    title: string,
    durationMinutes: number,
    label: string,
    budget: number,
    frequencyCap: number,
    category: string,
    tags: string[],
    locale: string,
    clicks: number,
    batchSize: number,
    status: LegacyModelDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.label = label;
    this.budget = budget;
    this.frequencyCap = frequencyCap;
    this.category = category;
    this.tags = tags;
    this.locale = locale;
    this.clicks = clicks;
    this.batchSize = batchSize;
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

  canMoveTo(next: LegacyModelDraftStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: LegacyModelDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy model draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedValue(): number {
    return Math.round((this.batchSize + this.clicks) * 100) / 100;
  }

  copy(): LegacyModelDraft {
    return new LegacyModelDraft(
      this.code,
      this.title,
      this.durationMinutes,
      this.label,
      this.budget,
      this.frequencyCap,
      this.category,
      this.tags,
      this.locale,
      this.clicks,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a legacy model draft in status created. */
export function newLegacyModelDraft(code: string, title: string): LegacyModelDraft {
  return new LegacyModelDraft(code, title, 0, "", 0, 0, "", [], "", 0, 0, "created");
}
