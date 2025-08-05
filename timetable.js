// 근무표 작성 조건:
// 1. 병동에 근무시간은 하루 8시간 3교대 근무로 통상 아침, 점심, 저녁 근무라고 명칭한다.
// 2. 아침근무에는 수간호사, 주임간호사, 2명의 간호사 총 4명이 근무한다.
// 3. 점심근무에는 3명의 간호사가 근무한다.
// 4. 저녁근무에는 3명의 간호사가 근무한다.
// 5. 저녁근무는 연속으로 3일을 하지 못하고 연속 3일 근무시 2일의 휴일을 지정한다.
// 6. 수간호사, 주임간호사는 휴일은 근무하지 않는다.
// 7. 수간호사, 주임간호사는 아침근무만 한다.
// 8. timetable에는 간호사 이름을 등록 하고, 수간호사, 주임간호사 입력 단추를 만들고 근무표 작성이라는 단추를 클릭하면 월별로 근무표가 작성되게 한다.
// 9. 작성된 근무표는 월단위로 작성한다.
// 10. 작성된 근무표를 수작업으로 작성할 수 있다.

const nurses = [
    { name: "김간호", type: "간호사" },
    { name: "박간호", type: "간호사" },
    { name: "이간호", type: "간호사" },
    { name: "최간호", type: "간호사" }
];
let headNurse = null;
let chiefNurse = null;
let teamLeader = null; // 팀장 추가

const shifts = ["아침", "점심", "저녁", "휴무"];

function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
}

// 요일 구하기 (0:일~6:토)
function getDayOfWeek(year, month, day) {
    return new Date(year, month - 1, day).getDay();
}

// 저녁근무 연속 3일 체크 및 2일 휴무 지정
function isValidEveningShift(nurseShifts, day) {
    if (day >= 2 && nurseShifts[day - 1] === "저녁" && nurseShifts[day - 2] === "저녁") {
        return false;
    }
    return true;
}

// 수간호사, 주임간호사, 팀장 아침근무만, 휴무 없음
function assignMorningShift(nurseName, days, year, month) {
    let shiftsArr = [];
    for (let d = 1; d <= days; d++) {
        const dayOfWeek = getDayOfWeek(year, month, d);
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            shiftsArr.push("휴일");
        } else {
            shiftsArr.push("아침");
        }
    }
    return shiftsArr;
}

// 간호사 근무표 생성
// 일반 간호사 근무표 생성 (휴일에도 근무, 아침/점심/저녁 각 3명)
function generateMonthlyTimetable(year, month) {
    const days = getDaysInMonth(year, month);
    let timetable = [];

    if (teamLeader) {
        timetable.push({ name: teamLeader, type: "팀장", shifts: assignMorningShift(teamLeader, days, year, month) });
    }
    if (headNurse) {
        timetable.push({ name: headNurse, type: "수간호사", shifts: assignMorningShift(headNurse, days, year, month) });
    }
    if (chiefNurse) {
        timetable.push({ name: chiefNurse, type: "주임간호사", shifts: assignMorningShift(chiefNurse, days, year, month) });
    }

    // 일반 간호사 근무표 (아침/점심/저녁 각 3명, 휴일에도 근무)
    let nurseCount = nurses.length;
    let nurseShiftsArr = Array(nurseCount).fill(0).map(() => []);
    for (let d = 1; d <= days; d++) {
        // 해당일 요일
        const dayOfWeek = getDayOfWeek(year, month, d);

        // 아침, 점심, 저녁 근무자 인덱스 섞기
        let idxArr = Array.from({length: nurseCount}, (_, i) => i);
        idxArr = idxArr.sort(() => Math.random() - 0.5);

        // 아침 3명, 점심 3명, 저녁 3명 배정
        for (let i = 0; i < nurseCount; i++) {
            let shift = "휴무";
            if (i < 3) shift = "아침";
            else if (i < 6) shift = "점심";
            else if (i < 9) shift = "저녁";
            // 저녁근무 연속 3일 불가, 3일 연속 시 2일 휴무
            if (shift === "저녁") {
                const nurseIdx = idxArr[i];
                const prevShifts = nurseShiftsArr[nurseIdx];
                const len = prevShifts.length;
                if (
                    len >= 2 &&
                    prevShifts[len - 1] === "저녁" &&
                    prevShifts[len - 2] === "저녁"
                ) {
                    shift = "휴무";
                }
            }
            // 마지막 날짜까지만 근무 추가
            if (nurseShiftsArr[idxArr[i]].length < days) {
                nurseShiftsArr[idxArr[i]].push(shift);
            }
        }
        // 나머지 간호사는 휴무
        for (let i = 9; i < nurseCount; i++) {
            if (nurseShiftsArr[idxArr[i]].length < days) {
                nurseShiftsArr[idxArr[i]].push("휴무");
            }
        }
    }

    // timetable에 반영 (마지막 날짜까지만 근무가 들어가도록 슬라이스)
    nurses.forEach((nurse, idx) => {
        timetable.push({ name: nurse.name, type: nurse.type, shifts: nurseShiftsArr[idx].slice(0, days) });
    });

    return { timetable, days };
}

// 근무표 렌더링 및 직접 수정 기능
function renderTimetable(timetable, days, year, month) {
    const container = document.getElementById('table-area');
    let html = `<h2>${year}년 ${month}월 근무표</h2>`;
    html += '<button id="download-btn">근무표 다운로드</button>';
    html += '<table id="edit-table"><thead><tr><th>이름</th>';
    for (let d = 1; d <= days; d++) {
        const dayOfWeek = getDayOfWeek(year, month, d);
        const weekStr = ["일", "월", "화", "수", "목", "금", "토"][dayOfWeek];
        html += `<th>${d}일<br>${weekStr}</th>`;
    }
    html += `<th>아침합계</th><th>점심합계</th><th>저녁합계</th><th>휴일합계</th>`;
    html += '</tr></thead><tbody>';
    timetable.forEach((row, rIdx) => {
        let morningCount = 0, lunchCount = 0, eveningCount = 0, holidayCount = 0;
        html += `<tr><td>${row.name}</td>`;
        row.shifts.forEach((shift, cIdx) => {
            let style = "";
            if (shift === "아침") {
                style = 'background:#b2f2a5'; morningCount++;
            } else if (shift === "점심") {
                style = 'background:#fff9b2'; lunchCount++;
            } else if (shift === "저녁") {
                style = 'background:#b2d7ff'; eveningCount++;
            } else if (shift === "휴일") {
                style = 'background:#eee'; holidayCount++;
            }
            if (shift === "휴일") {
                html += `<td style="${style}">${shift}</td>`;
            } else {
                html += `<td style="${style}"><input type="text" value="${shift}" data-row="${rIdx}" data-col="${cIdx}" style="width:60px"></td>`;
            }
        });
        html += `<td>${morningCount}</td><td>${lunchCount}</td><td>${eveningCount}</td><td>${holidayCount}</td>`;
        html += '</tr>';
    });
    html += '</tbody></table>';
    container.innerHTML = html;

    // 다운로드 버튼 이벤트
    document.getElementById('download-btn').onclick = () => {
        let csv = "이름";
        for (let d = 1; d <= days; d++) {
            const dayOfWeek = getDayOfWeek(year, month, d);
            const weekStr = ["일", "월", "화", "수", "목", "금", "토"][dayOfWeek];
            csv += `,${d}일(${weekStr})`;
        }
        csv += ",아침합계,점심합계,저녁합계,휴일합계\n";
        timetable.forEach((row, rIdx) => {
            let morningCount = 0, lunchCount = 0, eveningCount = 0, holidayCount = 0;
            let line = `"${row.name}"`;
            row.shifts.forEach((shift, cIdx) => {
                const input = document.querySelector(`input[data-row="${rIdx}"][data-col="${cIdx}"]`);
                const val = input ? input.value : shift;
                if (val === "아침") morningCount++;
                else if (val === "점심") lunchCount++;
                else if (val === "저녁") eveningCount++;
                else if (val === "휴일") holidayCount++;
                line += `,"${val}"`;
            });
            line += `,"${morningCount}","${lunchCount}","${eveningCount}","${holidayCount}"`;
            csv += line + "\n";
        });
        const blob = new Blob([csv], { type: "text/csv" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${year}년_${month}월_근무표.csv`;
        a.click();
    };

    // 직접 수정 반영
    document.querySelectorAll('#edit-table input[type="text"]').forEach(input => {
        input.addEventListener('change', function () {
            const r = parseInt(this.dataset.row);
            const c = parseInt(this.dataset.col);
            timetable[r].shifts[c] = this.value;
            // 합계 재계산을 위해 다시 렌더링
            renderTimetable(timetable, days, year, month);
        });
    });
}

// UI: 간호사 등록, 수간호사/주임간호사/팀장 입력, 월 선택
function setupUI() {
    // 입력 폼을 input-container에 렌더링하도록 수정
    const container = document.getElementById('input-container');

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;

    let nurseInputs = '';
    for (let i = 0; i < 17; i++) { // 17명으로 수정
        nurseInputs += `<input type="text" class="nurse-name-input" placeholder="간호사 이름${i + 1}"><br>`;
    }

    let html = `
        <label>팀장 이름: <input type="text" id="team-leader-input"></label><br> 
        <label>수간호사 이름: <input type="text" id="head-nurse-input"></label><br>
        <label>주임간호사 이름: <input type="text" id="chief-nurse-input"></label><br>
        <div>일반 간호사 이름 입력 (최대 17명):<br>${nurseInputs}</div>
        <label for="month-select">월 선택: </label>
        <select id="month-select">
            ${Array.from({length:12}, (_,i)=>`<option value="${i+1}" ${i+1===month?'selected':''}>${i+1}월</option>`).join('')}
        </select>
        <label for="year-input">년도: </label>
        <input type="number" id="year-input" value="${year}" min="2020" max="2100" style="width:80px;">
        <button id="generate-btn">근무표 작성</button>
        <div id="table-area"></div>
    `;
    container.innerHTML = html;

    document.getElementById('generate-btn').onclick = () => {
        headNurse = document.getElementById('head-nurse-input').value.trim();
        chiefNurse = document.getElementById('chief-nurse-input').value.trim();
        teamLeader = document.getElementById('team-leader-input').value.trim(); // 팀장 이름 가져오기

        nurses.length = 0;
        document.querySelectorAll('.nurse-name-input').forEach(input => {
            const name = input.value.trim();
            if (name) nurses.push({ name, type: "간호사" });
        });

        const selectedMonth = parseInt(document.getElementById('month-select').value);
        const selectedYear = parseInt(document.getElementById('year-input').value);
        const { timetable, days } = generateMonthlyTimetable(selectedYear, selectedMonth);
        renderTimetable(timetable, days, selectedYear, selectedMonth);

        const tableHtml = document.getElementById('table-area').innerHTML;
        window.openTimetableInNewWindow(tableHtml);
    };
}

window.onload = setupUI;
