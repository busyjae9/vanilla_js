import Todo from "./ui/main";
import { $qs } from "fxdom";
import Data from "./data/todo";

Data.reload();
Todo.init(Data.todayTodo);
Todo.delegate($qs("body"));
