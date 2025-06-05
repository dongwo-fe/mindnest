use thiserror::Error;
use tauri_plugin_sql::Error as SqlError;

#[derive(Debug, Error)]
pub enum NoteError {
    #[error("数据库错误: {0}")]
    Database(#[from] SqlError),
    
    #[error("笔记不存在: id={0}")]
    NotFound(i64),
    
    #[error("标题不能为空")]
    EmptyTitle,
    
    #[error("无效的分页参数: {0}")]
    InvalidPagination(String),
    
    #[error("搜索查询错误: {0}")]
    SearchError(String),
    
    #[error("系统错误: {0}")]
    System(String),
}

impl From<NoteError> for String {
    fn from(error: NoteError) -> Self {
        error.to_string()
    }
} 