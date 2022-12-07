import Todo from "./ui/todo";
import { $qs } from "fxdom";
import Prompt from "./ui/prompt";
import Todo_Data from "./data/todo";

Todo.initPipe();
Todo.delegate($qs(".container"));
