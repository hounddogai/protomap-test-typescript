/**
 * The model segment records of attribution's model work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a model segment is in its life cycle. */
export type ModelSegmentStatus = "created" | "validated" | "published" | "retired";

/** The record of a model segment and its current status. */
export class ModelSegment {
  code: string;
  title: string;
  locale: string;
  attributes: Map<string, string>;
  openRate: number;
  journeyId: string;
  audienceId: string;
  unit: string;
  createdAt: number;
  floorValue: number;
  status: ModelSegmentStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    attributes: Map<string, string>,
    openRate: number,
    journeyId: string,
    audienceId: string,
    unit: string,
    createdAt: number,
    floorValue: number,
    status: ModelSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.attributes = attributes;
    this.openRate = openRate;
    this.journeyId = journeyId;
    this.audienceId = audienceId;
    this.unit = unit;
    this.createdAt = createdAt;
    this.floorValue = floorValue;
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

  canMoveTo(next: ModelSegmentStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ModelSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model segment ${this.code} cannot move from ${this.status} to ${next}`);
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

  weightedLoad(): number {
    return Math.round(this.createdAt * this.floorValue * 100) / 100;
  }

  copy(): ModelSegment {
    return new ModelSegment(
      this.code,
      this.title,
      this.locale,
      this.attributes,
      this.openRate,
      this.journeyId,
      this.audienceId,
      this.unit,
      this.createdAt,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a model segment in status created. */
export function newModelSegment(code: string, title: string): ModelSegment {
  return new ModelSegment(code, title, "", new Map<string, string>(), 0, "", "", "", 0, 0, "created");
}
