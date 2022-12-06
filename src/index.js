import Todo from "./ui/todo";
import { $qs } from "fxdom";

Todo.initPipe();
Todo.delegate($qs(".container"));
