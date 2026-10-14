import * as text from "../../../../kit/text.js";

/** Where a pending complaint mapping is in its life cycle. */
export type PendingComplaintMappingStatus = "created" | "validated" | "published" | "retired";

/** A pending complaint mapping as the complaint team keeps it. */
export class PendingComplaintMapping {
  code: string;
  name: string;
  notes: string;
  margin: number;
  endsAt: number;
  openRate: number;
  audienceId: string;
  limit: number;
  quantity: number;
  visible: boolean;
  status: PendingComplaintMappingStatus;

  constructor(
    code: string,
    name: string,
    notes: string,
    margin: number,
    endsAt: number,
    openRate: number,
    audienceId: string,
    limit: number,
    quantity: number,
    visible: boolean,
    status: PendingComplaintMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.notes = notes;
    this.margin = margin;
    this.endsAt = endsAt;
    this.openRate = openRate;
    this.audienceId = audienceId;
    this.limit = limit;
    this.quantity = quantity;
    this.visible = visible;
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

  canMoveTo(next: PendingComplaintMappingStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
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

  moveTo(next: PendingComplaintMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending complaint mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"pending complaint mapping"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round(this.margin * this.quantity * 100) / 100;
  }

  copy(): PendingComplaintMapping {
    return new PendingComplaintMapping(
      this.code,
      this.name,
      this.notes,
      this.margin,
      this.endsAt,
      this.openRate,
      this.audienceId,
      this.limit,
      this.quantity,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a pending complaint mapping in status created. */
export function newPendingComplaintMapping(code: string, name: string): PendingComplaintMapping {
  return new PendingComplaintMapping(code, name, "", 0, 0, 0, "", 0, 0, false, "created");
}
