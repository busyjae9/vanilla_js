import Todo from "./ui/todo";
import { $qs } from "fxdom";
import Alert from "./ui/alert";
import { log } from "fxjs";

Todo.initPipe();
Todo.delegate($qs(".container"));
