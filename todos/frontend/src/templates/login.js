import { html } from 'fxjs';

const LoginUI = {};

LoginUI.loginTmp = () => html`
    <div class="bg_dark">
        <div class="login">
            <div class="login__title">로그인</div>
            <form action="" class="login__rows">
                <div class="login__row">
                    <div class="login__row__key">이메일</div>
                    <input
                        type="text"
                        class="login__row__value"
                        name="email"
                        placeholder="이메일을 입력해주세요."
                    />
                </div>
                <div class="login__row">
                    <div class="login__row__key">비밀번호</div>
                    <input
                        type="password"
                        class="login__row__value"
                        name="password"
                        placeholder="비밀번호를 입력해주세요."
                    />
                </div>
                <div class="login__buttons">
                    <input type="submit" class="login__button__login" value="로그인" />
                    <button type="button" class="login__button__reg">회원가입</button>
                    <!--<button type="button" class="login__button__find">찾기</button>-->
                </div>
            </form>
        </div>
    </div>
`;

LoginUI.regTmp = () => html`
    <div class="bg_dark">
        <div class="reg">
            <div class="reg__title">회원가입</div>
            <form action="" class="reg__rows">
                <div class="reg__row">
                    <div class="reg__row__key">이름</div>
                    <input
                        type="text"
                        class="reg__row__value"
                        name="name"
                        placeholder="이름을 입력해주세요."
                    />
                </div>
                <div class="reg__row">
                    <div class="reg__row__key">이메일</div>
                    <input
                        type="text"
                        class="reg__row__value"
                        name="email"
                        placeholder="이메일을 입력해주세요."
                    />
                </div>
                <div class="reg__row">
                    <div class="reg__row__key">비밀번호</div>
                    <input
                        type="password"
                        class="reg__row__value"
                        name="password"
                        placeholder="비밀번호를 입력해주세요."
                    />
                </div>
                <div class="reg__row">
                    <div class="reg__row__text">
                        대충 개인정보 및 합법적인 약관에 관한 내용으로 정재훈에게 TODO를 마음대로
                        열람할 수 있는 권한을 부여한다는 내용이 추가되어 있는 약관
                    </div>
                </div>
                <div class="reg__row">
                    <div class="reg__row__key">약관동의에 동의 하십니까?</div>
                    <input type="checkbox" class="reg__row__value" name="term" />
                </div>
                <div class="reg__buttons">
                    <input type="submit" class="reg__button__ok" value="회원가입" />
                    <button type="button" class="reg__button__cancel">취소</button>
                </div>
            </form>
        </div>
    </div>
`;

export default LoginUI;
