import { QUERY } from './backend/db/db_connect.js';

// QUERY`
//     UPDATE comments
//     SET reply_count = (SELECT COUNT(*) FROM replys WHERE replys.comment_id = comments.id
//     AND replys.deleted_date IS NULL)
// `.then(() => {
//     process.exit();
// });

QUERY`
    UPDATE likes
    SET attached_id = todo_id, attached_type = 'todos'
`.then(() => {
    process.exit();
});
