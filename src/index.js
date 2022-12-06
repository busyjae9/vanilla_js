import Todo from "./ui/todo";
import { $qs } from "fxdom";
import Alert from "./ui/alert";

Todo.initPipe();
Todo.delegate($qs(".container"));

Alert.pop({
  title: "제목입니다",
  msg: "메시지입니다",
  buttons: [
    {
      msg: "취소",
      classes: "cancel",
    },
    {
      msg: "확인",
      classes: "ok",
    },
  ],
});
