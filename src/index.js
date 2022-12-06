import Todo from "./tmp";
import { $qs } from "fxdom";

Todo.initPipe();
Todo.delegate($qs(".container"));
