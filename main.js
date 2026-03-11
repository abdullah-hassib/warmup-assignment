//abdullah hassib 16006201


const fs = require("fs");

// ============================================================
// Function 1: getShiftDuration(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getShiftDuration(startTime, endTime) {
   function toSeconds(time){

        let parts = time.split(" ");
        let clock = parts[0];
        let period = parts[1];

        let timeParts = clock.split(":");

        let hours = parseInt(timeParts[0]);
        let minutes = parseInt(timeParts[1]);
        let seconds = parseInt(timeParts[2]);

        if(period === "pm" && hours !== 12){
            hours += 12;
        }

        if(period === "am" && hours === 12){
            hours = 0;
        }

        return hours*3600 + minutes*60 + seconds;
    }

    let start = toSeconds(startTime);
    let end = toSeconds(endTime);

    let diff = end - start;

    let h = Math.floor(diff / 3600);
    let m = Math.floor((diff % 3600) / 60);
    let s = diff % 60;

   let mm = m.toString().padStart(2,"0");
let ss = s.toString().padStart(2,"0");

return h + ":" + mm + ":" + ss;
}


// ============================================================
// Function 2: getIdleTime(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getIdleTime(startTime, endTime) {
    function toSeconds(time){

        let parts = time.split(" ");
        let clock = parts[0];
        let period = parts[1];

        let t = clock.split(":");

        let h = parseInt(t[0]);
        let m = parseInt(t[1]);
        let s = parseInt(t[2]);

        if(period === "pm" && h !== 12){
            h += 12;
        }

        if(period === "am" && h === 12){
            h = 0;
        }

        return h*3600 + m*60 + s;
    }

    let start = toSeconds(startTime);
    let end = toSeconds(endTime);

    let eightAM = 8*3600;
    let tenPM = 22*3600;

    let idle = 0;

    if(start < eightAM){
        idle += eightAM - start;
    }

    if(end > tenPM){
        idle += end - tenPM;
    }

    let h = Math.floor(idle/3600);
    let m = Math.floor((idle%3600)/60);
    let s = idle%60;

    let mm = m.toString().padStart(2,"0");
    let ss = s.toString().padStart(2,"0");

    return h + ":" + mm + ":" + ss;
}

// ============================================================
// Function 3: getActiveTime(shiftDuration, idleTime)
// shiftDuration: (typeof string) formatted as h:mm:ss
// idleTime: (typeof string) formatted as h:mm:ss
// Returns: string formatted as h:mm:ss
// ============================================================
function getActiveTime(shiftDuration, idleTime) {
  // Function 3: Calculate active time (shiftDuration - idleTime)
   
    function timeToSeconds(timeStr) {
        const parts = timeStr.split(':');
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        const seconds = parseInt(parts[2], 10);
        return hours * 3600 + minutes * 60 + seconds;
    }
    
   
    function secondsToTime(totalSeconds) {
        totalSeconds = Math.max(0, totalSeconds);
        
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
 
    const shiftSeconds = timeToSeconds(shiftDuration);
    const idleSeconds = timeToSeconds(idleTime);
    
   
    const activeSeconds = shiftSeconds - idleSeconds;
    

    return secondsToTime(activeSeconds);
}


// ============================================================
// Function 4: metQuota(date, activeTime)
// date: (typeof string) formatted as yyyy-mm-dd
// activeTime: (typeof string) formatted as h:mm:ss
// Returns: boolean
// ============================================================
function metQuota(date, activeTime) {


    const [year, month, day] = date.split('-').map(num => parseInt(num, 10));
    
    const isEidPeriod = (year === 2025 && month === 4 && day >= 10 && day <= 30);
    
    const timeParts = activeTime.split(':');
    const activeSeconds = parseInt(timeParts[0]) * 3600 + 
                         parseInt(timeParts[1]) * 60 + 
                         parseInt(timeParts[2]);
    
    if (isEidPeriod) {
        return activeSeconds >= 6 * 3600;
    } else {
        return activeSeconds >= 8 * 3600 + 24 * 60;
    }
}


// ============================================================
// Function 5: addShiftRecord(textFile, shiftObj)
// textFile: (typeof string) path to shifts text file
// shiftObj: (typeof object) has driverID, driverName, date, startTime, endTime
// Returns: object with 10 properties or empty object {}
// ============================================================
function addShiftRecord(textFile, shiftObj) {
   const fs = require('fs');
    
    const fileContent = fs.readFileSync(textFile, 'utf8');
    const lines = fileContent.trim().split('\n');
    
    let driverExists = false;
    let lastIndexForDriver = -1;
    

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        
        const columns = lines[i].split(',');
        const currentDriverID = columns[0].trim();
        const currentDate = columns[2].trim();
        
        if (currentDriverID === shiftObj.driverID) {
            driverExists = true;
            lastIndexForDriver = i;
            
            if (currentDate === shiftObj.date) {
                return {}; // Duplicate found
            }
        }
    }
    
   
    const shiftDuration = getShiftDuration(shiftObj.startTime, shiftObj.endTime);
    const idleTime = getIdleTime(shiftObj.startTime, shiftObj.endTime);
    const activeTime = getActiveTime(shiftDuration, idleTime);
    const metQuotaValue = metQuota(shiftObj.date, activeTime);
    
    // Create CSV line
    const newLine = `${shiftObj.driverID},${shiftObj.driverName},${shiftObj.date},${shiftObj.startTime},${shiftObj.endTime},${shiftDuration},${idleTime},${activeTime},${metQuotaValue},false`;
    
    // Insert or append
    if (driverExists) {
        const updatedLines = [...lines];
        updatedLines.splice(lastIndexForDriver + 1, 0, newLine);
        fs.writeFileSync(textFile, updatedLines.join('\n'));
    } else {
        fs.writeFileSync(textFile, fileContent.trim() + '\n' + newLine);
    }
    
    return {
        driverID: shiftObj.driverID,
        driverName: shiftObj.driverName,
        date: shiftObj.date,
        startTime: shiftObj.startTime,
        endTime: shiftObj.endTime,
        shiftDuration: shiftDuration,
        idleTime: idleTime,
        activeTime: activeTime,
        metQuota: metQuotaValue,
        hasBonus: false
    };
}

// ============================================================
// Function 6: setBonus(textFile, driverID, date, newValue)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// date: (typeof string) formatted as yyyy-mm-dd
// newValue: (typeof boolean)
// Returns: nothing (void)
// ============================================================
function setBonus(textFile, driverID, date, newValue) {
   const fs = require('fs');
    
    const fileContent = fs.readFileSync(textFile, 'utf8');
    const lines = fileContent.trim().split('\n');
    
    let updated = false;
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        
        const columns = lines[i].split(',');
        const currentDriverID = columns[0].trim();
        const currentDate = columns[2].trim();
        
        if (currentDriverID === driverID && currentDate === date) {
            columns[9] = newValue.toString();
            lines[i] = columns.join(',');
            updated = true;
            break;
        }
    }
    
    if (updated) {
        fs.writeFileSync(textFile, lines.join('\n'));
    }
}

// ============================================================
// Function 7: countBonusPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof string) formatted as mm or m
// Returns: number (-1 if driverID not found)
// ============================================================
function countBonusPerMonth(textFile, driverID, month) {
     const fs = require('fs');
    
    const fileContent = fs.readFileSync(textFile, 'utf8');
    const lines = fileContent.trim().split('\n');
    
    // Normalize month to two digits (e.g., "4" -> "04", "04" -> "04")
    const normalizedMonth = month.padStart(2, '0');
    
    let driverFound = false;
    let bonusCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        
        const columns = lines[i].split(',');
        const currentDriverID = columns[0].trim();
        const currentDate = columns[2].trim();
        const hasBonus = columns[9].trim() === 'true';
        
        // Extract month from date (yyyy-mm-dd)
        const dateMonth = currentDate.split('-')[1];
        
        if (currentDriverID === driverID) {
            driverFound = true;
            
            // Check if month matches and hasBonus is true
            if (dateMonth === normalizedMonth && hasBonus) {
                bonusCount++;
            }
        }
    }
    
    return driverFound ? bonusCount : -1;
}

// ============================================================
// Function 8: getTotalActiveHoursPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getTotalActiveHoursPerMonth(textFile, driverID, month) {
   const fs = require('fs');
    
    const fileContent = fs.readFileSync(textFile, 'utf8');
    const lines = fileContent.trim().split('\n');
    
    // Convert month to two-digit string for comparison
    const monthStr = month.toString().padStart(2, '0');
    
    let totalSeconds = 0;
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        
        const columns = lines[i].split(',');
        const currentDriverID = columns[0].trim();
        const currentDate = columns[2].trim();
        const activeTime = columns[7].trim();
        
        // Extract month from date (yyyy-mm-dd)
        const dateMonth = currentDate.split('-')[1];
        
        // Check if this is the correct driver and month
        if (currentDriverID === driverID && dateMonth === monthStr) {
            // Parse activeTime (format: h:mm:ss)
            const timeParts = activeTime.split(':');
            const hours = parseInt(timeParts[0], 10);
            const minutes = parseInt(timeParts[1], 10);
            const seconds = parseInt(timeParts[2], 10);
            
            totalSeconds += hours * 3600 + minutes * 60 + seconds;
        }
    }
    
    // Convert total seconds to hhh:mm:ss format
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

// ============================================================
// Function 9: getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month)
// textFile: (typeof string) path to shifts text file
// rateFile: (typeof string) path to driver rates text file
// bonusCount: (typeof number) total bonuses for given driver per month
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month) {
    const fs = require('fs');
    
    const shiftsContent = fs.readFileSync(textFile, 'utf8');
    const ratesContent = fs.readFileSync(rateFile, 'utf8');
    
    const shiftsLines = shiftsContent.trim().split('\n');
    const ratesLines = ratesContent.trim().split('\n');
    
    const monthStr = month.toString().padStart(2, '0');
    
    let dayOff = '';
    for (let i = 0; i < ratesLines.length; i++) {
        if (ratesLines[i].trim() === '') continue;
        
        const columns = ratesLines[i].split(',');
        const currentDriverID = columns[0].trim();
        
        if (currentDriverID === driverID) {
            dayOff = columns[1].trim();
            break;
        }
    }
    
    if (dayOff === '') {
        return "0:00:00";
    }
    
    const dayToNumber = {
        'Sunday': 0,
        'Monday': 1,
        'Tuesday': 2,
        'Wednesday': 3,
        'Thursday': 4,
        'Friday': 5,
        'Saturday': 6
    };
    
    const dayOffNumber = dayToNumber[dayOff];
    
    const processedDates = new Set();
    let totalRequiredSeconds = 0;
    
    for (let i = 0; i < shiftsLines.length; i++) {
        if (shiftsLines[i].trim() === '') continue;
        
        const columns = shiftsLines[i].split(',');
        const currentDriverID = columns[0].trim();
        const currentDate = columns[2].trim();
        
        if (currentDriverID === driverID) {
            const [year, monthNum, day] = currentDate.split('-').map(num => parseInt(num, 10));
            
            if (monthNum === month) {
                if (!processedDates.has(currentDate)) {
                    processedDates.add(currentDate);
                    
                    const dateObj = new Date(year, monthNum - 1, day);
                    const dayOfWeek = dateObj.getDay();
                    
                    if (dayOfWeek === dayOffNumber) {
                        continue;
                    }
                    
                    const isEidPeriod = (year === 2025 && monthNum === 4 && day >= 10 && day <= 30);
                    
                    if (isEidPeriod) {
                        totalRequiredSeconds += 6 * 3600;
                    } else {
                        totalRequiredSeconds += 8 * 3600 + 24 * 60;
                    }
                }
            }
        }
    }
    
    totalRequiredSeconds -= bonusCount * 2 * 3600;
    totalRequiredSeconds = Math.max(0, totalRequiredSeconds);
    
    const hours = Math.floor(totalRequiredSeconds / 3600);
    const minutes = Math.floor((totalRequiredSeconds % 3600) / 60);
    const seconds = totalRequiredSeconds % 60;
    
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

// ============================================================
// Function 10: getNetPay(driverID, actualHours, requiredHours, rateFile)
// driverID: (typeof string)
// actualHours: (typeof string) formatted as hhh:mm:ss
// requiredHours: (typeof string) formatted as hhh:mm:ss
// rateFile: (typeof string) path to driver rates text file
// Returns: integer (net pay)
// ============================================================
function getNetPay(driverID, actualHours, requiredHours, rateFile) {
    const fs = require('fs');
    
    const ratesContent = fs.readFileSync(rateFile, 'utf8');
    const ratesLines = ratesContent.trim().split('\n');
    
    let basePay = 0;
    let tier = 0;
    
    for (let i = 0; i < ratesLines.length; i++) {
        if (ratesLines[i].trim() === '') continue;
        
        const columns = ratesLines[i].split(',');
        const currentDriverID = columns[0].trim();
        
        if (currentDriverID === driverID) {
            basePay = parseInt(columns[2].trim(), 10);
            tier = parseInt(columns[3].trim(), 10);
            break;
        }
    }
    
    if (basePay === 0) {
        return 0;
    }
    
    function timeToSeconds(timeStr) {
        const parts = timeStr.split(':');
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        const seconds = parseInt(parts[2], 10);
        return hours * 3600 + minutes * 60 + seconds;
    }
    
    const actualSeconds = timeToSeconds(actualHours);
    const requiredSeconds = timeToSeconds(requiredHours);
    
    if (actualSeconds >= requiredSeconds) {
        return basePay;
    }
    
    const missingSeconds = requiredSeconds - actualSeconds;
    
    let allowedMissingHours = 0;
    switch(tier) {
        case 1: allowedMissingHours = 50; break;
        case 2: allowedMissingHours = 20; break;
        case 3: allowedMissingHours = 10; break;
        case 4: allowedMissingHours = 3; break;
    }
    
    const allowedSeconds = allowedMissingHours * 3600;
    const billableMissingSeconds = Math.max(0, missingSeconds - allowedSeconds);
    const billableMissingHours = Math.floor(billableMissingSeconds / 3600);
    const deductionRatePerHour = Math.floor(basePay / 185);
    const salaryDeduction = billableMissingHours * deductionRatePerHour;
    const netPay = basePay - salaryDeduction;
    
    return netPay;
}

module.exports = {
    getShiftDuration,
    getIdleTime,
    getActiveTime,
    metQuota,
    addShiftRecord,
    setBonus,
    countBonusPerMonth,
    getTotalActiveHoursPerMonth,
    getRequiredHoursPerMonth,
    getNetPay
};
