import Todo from "./ui/main";
import { $qs } from "fxdom";
import Todo_Data from "./data/todo";

Todo_Data.reload();
Todo.initPipe();
Todo.delegate($qs(".container"));
