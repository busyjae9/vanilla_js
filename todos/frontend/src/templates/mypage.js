import { go, html } from 'fxjs';

const MyPageUI = {};

MyPageUI.makeTmp = (my_info, mypage) => html`
    <div class="my_page">
        <div class="my_page__header">
            <img
                class="my_page__header__image"
                src="https://source.unsplash.com/random/1200x200/?programming,javascript"
            />
        </div>
        ${mypage
            ? ''
            : `
        <button id='user_follow_${my_info.id}' status='${
                  my_info.is_followed ? 'delete' : 'post'
              }' class='my_page__follow'>
           ${my_info.is_followed ? '팔로우 취소' : '팔로우'}
        </button>
        `}
        <div class="my_page__info">
            <div class="my_page__info__title">${my_info.name}님의 정보</div>
            <div class="my_page__info__row" direction="column">
                <div class="my_page__info__row__follower">
                    <div class="my_page__info__row__title">팔로워</div>
                    <div id="user_follower" class="my_page__info__row__data">
                        ${my_info.follower_count}명
                    </div>
                    <ion-icon class="my_page__info__row__icon" name="chevron-down-sharp"></ion-icon>
                </div>
                <div status="before" class="my_page__info__row__followers"></div>
                <div class="my_page__info__row__followers__more">더보기</div>
            </div>
            <div class="my_page__info__row" direction="column">
                <div class="my_page__info__row__following">
                    <div class="my_page__info__row__title">팔로잉</div>
                    <div id="user_following" class="my_page__info__row__data">
                        ${my_info.following_count}명
                    </div>
                    <ion-icon class="my_page__info__row__icon" name="chevron-down-sharp"></ion-icon>
                </div>
                <div status="before" class="my_page__info__row__followings"></div>
                <div class="my_page__info__row__followings__more">더보기</div>
            </div>
            <div class="my_page__info__title">${my_info.name}님의 TODO 정보</div>
            <div class="my_page__info__row">
                <div class="my_page__info__row__title">활성화된 TODO</div>
                <div class="my_page__info__row__data">${my_info.todo_count}개</div>
            </div>
            <div class="my_page__info__row">
                <div class="my_page__info__row__title">완료한 TODO</div>
                <div class="my_page__info__row__data">${my_info.checked_count}개</div>
            </div>
            <div class="my_page__info__row">
                <div class="my_page__info__row__title">보관된 TODO</div>
                <div class="my_page__info__row__data">${my_info.archive_count}개</div>
            </div>
            <div class="my_page__info__row">
                <div class="my_page__info__row__title">TODO 댓글</div>
                <div class="my_page__info__row__data">${my_info.comment_count}개</div>
            </div>
            <div class="my_page__info__row">
                <div class="my_page__info__row__title">TODO 좋아요</div>
                <div class="my_page__info__row__data">${my_info.like_count}개</div>
            </div>
        </div>
    </div>
`;

MyPageUI.mkMyFollowerTmp = (follower) => html`
    <div id="follower_${follower.id}" class="my_page__info__row__followers__person">
        <div class="my_page__info__row__followers__person__info">
            <div class="my_page__info__row__followers__person__info__name">${follower.name}</div>
            <div class="my_page__info__row__followers__person__info__email">${follower.email}</div>
        </div>
        <div class="my_page__info__row__followers__person__buttons">
            <button class="my_page__info__row__followers__person__buttons__delete">삭제</button>
        </div>
    </div>
`;

MyPageUI.mkMyFollowingTmp = (following) => html`
    <div id="following_${following.id}" class="my_page__info__row__followings__person">
        <div class="my_page__info__row__followings__person__info">
            <div class="my_page__info__row__followings__person__info__name">${following.name}</div>
            <div class="my_page__info__row__followings__person__info__email">
                ${following.email}
            </div>
        </div>
        <div class="my_page__info__row__followings__person__buttons">
            <button class="my_page__info__row__followings__person__buttons__cancel">
                팔로잉 취소
            </button>
        </div>
    </div>
`;

MyPageUI.mkFollowerTmp = (follower) => html`
    <div id="follower_${follower.id}" class="my_page__info__row__followers__person">
        <div class="my_page__info__row__followers__person__info">
            <div class="my_page__info__row__followers__person__info__name">${follower.name}</div>
            <div class="my_page__info__row__followers__person__info__email">${follower.email}</div>
        </div>
        <div class="my_page__info__row__followers__person__buttons"></div>
    </div>
`;

MyPageUI.mkFollowingTmp = (following) => html`
    <div id="following_${following.id}" class="my_page__info__row__followings__person">
        <div class="my_page__info__row__followings__person__info">
            <div class="my_page__info__row__followings__person__info__name">${following.name}</div>
            <div class="my_page__info__row__followings__person__info__email">
                ${following.email}
            </div>
        </div>
        <div class="my_page__info__row__followings__person__buttons"></div>
    </div>
`;

export default MyPageUI;
