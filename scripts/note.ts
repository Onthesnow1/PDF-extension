import {RxJsonSchema} from 'rxdb';

export interface NoteDocType {
    id: string; // 笔记ID
    wid: string; // 工作区ID
    content: string; // 笔记内容
    create_at: number; // 创建时间
    update_at: number; // 更新时间
}

export const noteSchema: RxJsonSchema<NoteDocType> = {
    title: 'note schema',
    version: 0,
    description: '笔记模式',
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: {
            type: 'string',
            maxLength: 100
        },
        wid: {
            type: 'string',
            maxLength: 100
        },
        content: {
            type: 'string'
        },
        create_at: {
            type: 'number',
            minimum: 0
        },
        update_at: {
            type: 'number',
            minimum: 0
        }
    },
    required: ['id', 'wid', 'content'],
    indexes: ['wid']
}; 