// 子包重导出根目录 store 模块，以便子包引用正常
import * as _mod from '../../../api/store.js'

export * from '../../../api/store.js'
export default _mod
