export enum ApiBlockType {
  Text = 'text',
  Checklist = 'checklist',
}

export interface ApiChecklistItemDto {
  text: string;
  checked: boolean;
}

export interface ApiTextBlockDto {
  id: string;
  type: ApiBlockType.Text;
  content: string;
}

export interface ApiChecklistBlockDto {
  id: string;
  type: ApiBlockType.Checklist;
  content: string;
  items: ApiChecklistItemDto[];
}

export type ApiBlockDto = ApiTextBlockDto | ApiChecklistBlockDto;
