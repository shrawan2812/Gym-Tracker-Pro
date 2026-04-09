const entries = [];
let chartDuration, chartCalories, chartWater, chartSleep;

// Calorie rates per minute for each exercise
const calorieRates = {
    'Running': 10,
    'Walking': 5,
    'Yoga': 4,
    'Gym': 8,
    'Cycling': 7
};

// Function to calculate and update calories
function calculateCalories() {
    const exercise = document.getElementById('exercise').value;
    const duration = Number(document.getElementById('duration').value || 0);
    if (exercise && duration > 0) {
        const rate = calorieRates[exercise];
        const calories = duration * rate;
        document.getElementById('calories').value = calories.toFixed(0);
    } else {
        document.getElementById('calories').value = '';
    }
}

// Function to calculate recovery rate based on sleep and water intake
function calculateRecoveryRate() {
    const water = Number(document.getElementById('water').value || 0);
    const sleep = Number(document.getElementById('sleep').value || 0);
    if (water > 0 && sleep > 0) {
        const sleepScore = (sleep / 8) * 50;
        const waterScore = (water / 2) * 50;
        const recovery = Math.min(sleepScore + waterScore, 100);
        document.getElementById('recoveryRate').value = recovery.toFixed(1);
    } else {
        document.getElementById('recoveryRate').value = '';
    }
}

// Add event listeners for automatic calculation
document.getElementById('exercise').addEventListener('change', calculateCalories);
document.getElementById('duration').addEventListener('input', calculateCalories);
document.getElementById('water').addEventListener('input', calculateRecoveryRate);
document.getElementById('sleep').addEventListener('input', calculateRecoveryRate);

function buildChart(canvasId, label, data, color) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: entries.map(e => e.date),
            datasets: [{
                label,
                data,
                borderColor: color,
                backgroundColor: color.replace('1)', '0.1)'),
                fill: true,
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: color,
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                x: {
                    grid: { color: 'rgba(0,0,0,0.05)' }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: { font: { size: 12, weight: 'bold' }, padding: 15 }
                }
            }
        }
    });
}

function renderChart() {
    const labels = entries.map(entry => entry.date);
    const durationData = entries.map(entry => entry.duration);
    const caloriesData = entries.map(entry => entry.calories);
    const waterData = entries.map(entry => entry.water);
    const sleepData = entries.map(entry => entry.sleep);
    
    if (chartDuration) chartDuration.destroy();
    if (chartCalories) chartCalories.destroy();
    if (chartWater) chartWater.destroy();
    if (chartSleep) chartSleep.destroy();

    chartDuration = buildChart('chartDuration', 'Duration (min)', durationData, 'rgba(75, 192, 192, 1)');
    chartCalories = buildChart('chartCalories', 'Calories', caloriesData, 'rgba(255, 99, 132, 1)');
    chartWater = buildChart('chartWater', 'Water (L)', waterData, 'rgba(54, 162, 235, 1)');
    chartSleep = buildChart('chartSleep', 'Sleep (hrs)', sleepData, 'rgba(255, 206, 86, 1)');
}

// Export tracker data to Excel
function exportToExcel() {
    if (entries.length === 0) {
        showNotification('No data to export. Please add some fitness entries first.', 'error');
        return;
    }
    
    try {
        const excelData = [
            ['Date', 'Exercise', 'Duration (min)', 'Calories', 'Water (L)', 'Sleep (hrs)', 'Recovery %']
        ];
        
        entries.forEach(entry => {
            excelData.push([
                entry.date,
                entry.exercise,
                entry.duration,
                entry.calories,
                entry.water || '',
                entry.sleep || '',
                entry.recoveryRate ? entry.recoveryRate.toFixed(1) + '%' : 'N/A'
            ]);
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(excelData);
        ws['!cols'] = [
            {wch: 12}, {wch: 12}, {wch: 15}, {wch: 12},
            {wch: 12}, {wch: 12}, {wch: 12}
        ];
        XLSX.utils.book_append_sheet(wb, ws, 'Fitness Data');
        XLSX.writeFile(wb, `fitness-data-${new Date().toISOString().split('T')[0]}.xlsx`);
        showNotification('Data exported successfully!', 'success');
    } catch (error) {
        showNotification('Error exporting data. Please try again.', 'error');
        console.error('Export error:', error);
    }
}

function showNotification(message, type = 'info') {
    const div = document.createElement('div');
    div.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    div.textContent = message;
    document.body.appendChild(div);
    
    setTimeout(() => {
        div.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => div.remove(), 300);
    }, 3000);
}

document.getElementById('exportBtn').addEventListener('click', exportToExcel);

// Form Submission
document.getElementById("fitnessForm").addEventListener("submit", function(e) {
    e.preventDefault();
    
    const date = document.getElementById("date").value;
    const exercise = document.getElementById("exercise").value;
    const duration = Number(document.getElementById("duration").value || 0);
    
    // Validation
    if (!date || !exercise || duration <= 0) {
        showNotification('Please fill in all required fields correctly', 'error');
        return;
    }
    
    if (duration > 480) {
        showNotification('Duration seems too high. Please verify.', 'error');
        return;
    }
    
    const calories = Number(document.getElementById("calories").value || 0);
    const water = Number(document.getElementById("water").value || 0);
    const sleep = Number(document.getElementById("sleep").value || 0);
    const recoveryRate = Number(document.getElementById("recoveryRate").value || 0);

    entries.push({ date, exercise, duration, calories, water, sleep, recoveryRate });

    const table = document.getElementById("dataTable").querySelector('tbody');
    const row = table.insertRow(0);
    row.insertCell(0).innerText = date;
    row.insertCell(1).innerText = exercise;
    row.insertCell(2).innerText = duration;
    row.insertCell(3).innerText = calories.toFixed(0);
    row.insertCell(4).innerText = water || '-';
    row.insertCell(5).innerText = sleep || '-';
    row.insertCell(6).innerText = recoveryRate > 0 ? recoveryRate.toFixed(1) + '%' : '-';

    document.getElementById("fitnessForm").reset();
    renderChart();
    showNotification('Entry added successfully!', 'success');
});

// UI Navigation
function showSection(section) {
    const trackerSection = document.getElementById('trackerSection');
    const navTracker = document.getElementById('navTracker');
    const navDiet = document.getElementById('navDiet');
    
    if (section === 'tracker') {
        trackerSection.style.display = 'block';
        navTracker.classList.add('active');
        navDiet.classList.remove('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        trackerSection.style.display = 'none';
        navTracker.classList.remove('active');
        navDiet.classList.add('active');
    }
}

function scrollToDiet() {
    showSection('diet');
    setTimeout(() => {
        document.getElementById('dietPlansSection').scrollIntoView({ behavior: 'smooth' });
    }, 100);
    document.getElementById('dietMessage').innerText = '';
}

// ================= DIET PLAN DATA & EXPORT =================
const dietPlans = {
    "50-60kg": {
        title: "50kg → 60kg Target",
        target: "Daily target: ~2,100–2,400 kcal | Protein: 80–110g",
        data: [
            ["Day","Breakfast","Mid-Morning","Lunch","Afternoon","Dinner","Evening"],
            ["Mon","Oats w/ banana, honey, almonds + whole milk","Greek yogurt + berries","Brown rice, dal, paneer bhurji, cucumber raita","Peanut butter toast + apple","Chicken curry, roti, sautéed spinach","Warm milk + 2 dates"],
            ["Tue","2-egg omelette, whole wheat toast, avocado","Handful mixed nuts + raisins","Quinoa salad w/ chickpeas, veggies, olive oil dressing","Smoothie: milk, mango, protein powder","Baked fish, sweet potato mash, green beans","Cottage cheese + pineapple"],
            ["Wed","Idli (4) w/ sambar + coconut chutney + milk","Sprouts chaat w/ lemon","Chicken biryani (small portion), raita, salad","Banana + handful walnuts","Lentil soup, whole wheat bread, stir-fry veggies","Dark chocolate square + almonds"],
            ["Thu","Poha w/ peanuts, peas + boiled egg + orange","Protein shake w/ oats","Rajma curry, brown rice, cucumber-tomato salad","Roasted chana + jaggery","Grilled chicken breast, quinoa, broccoli","Warm turmeric milk + figs"],
            ["Fri","Upma w/ veggies + curd + handful cashews","Apple slices + peanut butter","Fish curry, millet roti, cabbage sabzi","Yogurt + flaxseeds + honey","Egg bhurji, whole wheat paratha, salad","Dates stuffed with almonds"],
            ["Sat","Smoothie bowl: berries, banana, oats, milk, chia","Hard-boiled egg + whole grain cracker","Paneer tikka, brown rice, mixed veg curry","Trail mix (nuts, seeds, dried fruit)","Lamb stew, whole wheat bread, carrots","Cottage cheese + honey"],
            ["Sun","Stuffed paratha (potato/paneer) + curd + pickle","Fruit salad w/ yogurt","Chicken curry, jeera rice, dal, salad","Peanut chikki + warm milk","Baked salmon, sweet potato, asparagus","Handful pistachios + warm milk"]
        ]
    },
    "60-70kg": {
        title: "60kg → 70kg Target",
        target: "Daily target: ~2,400–2,700 kcal | Protein: 95–130g",
        data: [
            ["Day","Breakfast","Mid-Morning","Lunch","Afternoon","Dinner","Evening"],
            ["Mon","3-egg scramble, 2 toast, avocado, orange","Protein bar + banana","Chicken breast, brown rice, broccoli, olive oil drizzle","Greek yogurt + granola + honey","Beef stir-fry w/ veggies, quinoa","Warm milk + almond butter"],
            ["Tue","Oats w/ protein powder, berries, walnuts, milk","Hummus + whole wheat pita","Lentil curry, 2 rotis, paneer, salad","Smoothie: milk, dates, oats, peanut butter","Grilled fish, sweet potato, green beans","Cottage cheese + pineapple chunks"],
            ["Wed","Idli (5) + sambar + 2 eggs + milk","Mixed nuts + dried apricots","Chicken curry, brown rice, dal, raita","Apple + cheese slice + crackers","Paneer bhurji, 2 parathas, cucumber salad","Dark chocolate + almonds"],
            ["Thu","Smoothie bowl: mango, banana, oats, chia, milk","Roasted chana + jaggery","Rajma, brown rice, mixed veg, curd","Peanut butter banana toast","Baked chicken thighs, quinoa, roasted carrots","Warm turmeric milk + figs"],
            ["Fri","Upma w/ extra veggies + 2 boiled eggs + curd","Trail mix + orange","Fish curry, millet roti, cabbage sabzi, dal","Yogurt + honey + flaxseeds","Egg curry, 2 whole wheat rotis, salad","Dates + walnuts"],
            ["Sat","2 stuffed parathas + curd + pickle + milk","Protein shake + handful almonds","Chicken biryani (moderate), raita, salad","Roasted peanuts + jaggery","Lamb curry, brown rice, sautéed spinach","Cottage cheese + honey + berries"],
            ["Sun","3-egg omelette, 2 toast, avocado, fruit","Greek yogurt + granola","Grilled salmon, sweet potato mash, asparagus","Apple + peanut butter + crackers","Paneer tikka, quinoa, mixed veg curry","Warm milk + 2 dates + almonds"]
        ]
    },
    "70-80kg": {
        title: "70kg → 80kg Target",
        target: "Daily target: ~2,700–3,000 kcal | Protein: 115–155g",
        data: [
            ["Day","Breakfast","Mid-Morning","Lunch","Afternoon","Dinner","Evening"],
            ["Mon","4-egg omelette, 3 toast, avocado, banana, milk","Protein shake + handful walnuts","Chicken breast (150g), brown rice (1.5 cups), broccoli, olive oil","Greek yogurt + granola + honey + berries","Beef stir-fry (120g beef), quinoa, mixed veggies","Warm milk + almond butter + 2 dates"],
            ["Tue","Oats (1 cup dry) w/ protein powder, berries, almonds, milk","Hummus + whole wheat pita + cucumber","Lentil curry, 3 rotis, paneer (100g), large salad","Smoothie: milk, dates, oats, peanut butter, banana","Grilled fish (150g), sweet potato (large), green beans","Cottage cheese (150g) + pineapple"],
            ["Wed","Idli (6) + sambar + 3 eggs + milk + fruit","Mixed nuts (30g) + dried fruit","Chicken curry (120g), brown rice, dal, raita, salad","Apple + cheese + whole grain crackers + peanut butter","Paneer bhurji (120g), 3 parathas, cucumber-tomato salad","Dark chocolate + almonds + warm milk"],
            ["Thu","Smoothie bowl: mango, banana, oats, chia, protein powder, milk","Roasted chana + jaggery + orange","Rajma, brown rice (1.5 cups), mixed veg, curd, roti","Peanut butter banana toast + handful almonds","Baked chicken thighs (150g), quinoa, roasted carrots","Warm turmeric milk + figs + walnuts"],
            ["Fri","Upma w/ extra veggies + 3 boiled eggs + curd + fruit","Trail mix (40g) + orange","Fish curry (150g), 2 millet rotis, cabbage sabzi, dal","Yogurt + honey + flaxseeds + granola","Egg curry (3 eggs), 3 whole wheat rotis, large salad","Dates (3) + walnuts + warm milk"],
            ["Sat","3 stuffed parathas + curd + pickle + milk + fruit","Protein shake + almonds + banana","Chicken biryani (moderate-large), raita, large salad","Roasted peanuts + jaggery + banana","Lamb curry (120g), brown rice, sautéed spinach","Cottage cheese + honey + berries + almonds"],
            ["Sun","4-egg scramble, 3 toast, avocado, fruit, milk","Greek yogurt + granola + honey","Grilled salmon (150g), large sweet potato, asparagus, olive oil","Apple + peanut butter + crackers + cheese","Paneer tikka (120g), quinoa, mixed veg curry, roti","Warm milk + 3 dates + almonds + pistachios"]
        ]
    },
    "80-90kg": {
        title: "80kg → 90kg Target",
        target: "Daily target: ~3,000–3,300 kcal | Protein: 130–175g",
        data: [
            ["Day","Breakfast","Mid-Morning","Lunch","Afternoon","Dinner","Evening"],
            ["Mon","4-egg omelette, 3 toast, avocado, banana, oats, milk","Protein shake + walnuts + banana","Chicken breast (180g), brown rice (2 cups), broccoli, olive oil, quinoa side","Greek yogurt + granola + honey + berries + almonds","Beef stir-fry (150g), quinoa (1.5 cups), mixed veggies, avocado","Warm milk + almond butter + 3 dates + handful almonds"],
            ["Tue","Oats (1.25 cups dry) w/ protein powder, berries, almonds, milk, banana","Hummus + whole wheat pita + cucumber + cheese","Lentil curry, 3-4 rotis, paneer (120g), large salad, curd","Smoothie: milk, dates, oats, peanut butter, banana, protein powder","Grilled fish (180g), large sweet potato, green beans, olive oil","Cottage cheese (200g) + pineapple + honey"],
            ["Wed","Idli (7) + sambar + 3 eggs + milk + fruit + handful nuts","Mixed nuts (40g) + dried fruit + banana","Chicken curry (150g), brown rice (1.5 cups), dal, raita, large salad","Apple + cheese + whole grain crackers + peanut butter + yogurt","Paneer bhurji (150g), 3-4 parathas, cucumber-tomato salad, curd","Dark chocolate + almonds + warm milk + figs"],
            ["Thu","Smoothie bowl: mango, banana, oats, chia, protein powder, milk, nut butter","Roasted chana + jaggery + orange + handful almonds","Rajma, brown rice (2 cups), mixed veg, curd, 2 rotis","Peanut butter banana toast + granola + milk","Baked chicken thighs (180g), quinoa (1.5 cups), roasted carrots, olive oil","Warm turmeric milk + figs + walnuts + dates"],
            ["Fri","Upma w/ extra veggies + 3 boiled eggs + curd + fruit + nuts","Trail mix (50g) + orange + banana","Fish curry (180g), 2-3 millet rotis, cabbage sabzi, dal, salad","Yogurt + honey + flaxseeds + granola + berries","Egg curry (4 eggs), 3-4 whole wheat rotis, large salad, avocado","Dates (4) + walnuts + warm milk + almonds"],
            ["Sat","3-4 stuffed parathas + curd + pickle + milk + fruit + nuts","Protein shake + almonds + banana + oats","Chicken biryani (large portion), raita, large salad, extra roti","Roasted peanuts + jaggery + banana + handful cashews","Lamb curry (150g), brown rice (1.5 cups), sautéed spinach, olive oil","Cottage cheese + honey + berries + almonds + warm milk"],
            ["Sun","4-egg scramble, 3-4 toast, avocado, fruit, milk, oats","Greek yogurt + granola + honey + berries + nuts","Grilled salmon (180g), large sweet potato, asparagus, olive oil, quinoa side","Apple + peanut butter + crackers + cheese + banana","Paneer tikka (150g), quinoa (1.5 cups), mixed veg curry, 2 rotis","Warm milk + 3-4 dates + almonds + pistachios + honey"]
        ]
    },
    "90-100kg": {
        title: "90kg → 100kg Target",
        target: "Daily target: ~3,300–3,600 kcal | Protein: 145–200g",
        data: [
            ["Day","Breakfast","Mid-Morning","Lunch","Afternoon","Dinner","Evening"],
            ["Mon","5-egg omelette, 4 toast, avocado, banana, oats, milk, nut butter","Protein shake + walnuts + banana + handful almonds","Chicken breast (200g), brown rice (2.5 cups), broccoli, olive oil, quinoa, side salad","Greek yogurt + granola + honey + berries + almonds + chia","Beef stir-fry (180g), quinoa (2 cups), mixed veggies, avocado, olive oil","Warm milk + almond butter + 3-4 dates + handful almonds + honey"],
            ["Tue","Oats (1.5 cups dry) w/ protein powder, berries, almonds, milk, banana, nut butter","Hummus + whole wheat pita + cucumber + cheese + olive oil","Lentil curry, 4 rotis, paneer (150g), large salad, curd, olive oil drizzle","Smoothie: milk, dates, oats, peanut butter, banana, protein powder, chia","Grilled fish (200g), large sweet potato, green beans, olive oil, side quinoa","Cottage cheese (250g) + pineapple + honey + almonds"],
            ["Wed","Idli (8) + sambar + 4 eggs + milk + fruit + handful nuts + granola","Mixed nuts (50g) + dried fruit + banana + yogurt","Chicken curry (180g), brown rice (2 cups), dal, raita, large salad, extra roti","Apple + cheese + whole grain crackers + peanut butter + yogurt + banana","Paneer bhurji (180g), 4 parathas, cucumber-tomato salad, curd, avocado","Dark chocolate + almonds + warm milk + figs + honey"],
            ["Thu","Smoothie bowl: mango, banana, oats, chia, protein powder, milk, nut butter, granola","Roasted chana + jaggery + orange + handful almonds + banana","Rajma, brown rice (2.5 cups), mixed veg, curd, 2-3 rotis, olive oil","Peanut butter banana toast + granola + milk + berries + honey","Baked chicken thighs (200g), quinoa (2 cups), roasted carrots, olive oil, side salad","Warm turmeric milk + figs + walnuts + dates + honey"],
            ["Fri","Upma w/ extra veggies + 4 boiled eggs + curd + fruit + nuts + toast","Trail mix (60g) + orange + banana + yogurt","Fish curry (200g), 3 millet rotis, cabbage sabzi, dal, large salad, avocado","Yogurt + honey + flaxseeds + granola + berries + banana","Egg curry (4-5 eggs), 4 whole wheat rotis, large salad, avocado, olive oil","Dates (4-5) + walnuts + warm milk + almonds + honey"],
            ["Sat","4 stuffed parathas + curd + pickle + milk + fruit + nuts + banana","Protein shake + almonds + banana + oats + honey","Chicken biryani (extra large), raita, large salad, 2 extra rotis, olive oil","Roasted peanuts + jaggery + banana + handful cashews + yogurt","Lamb curry (180g), brown rice (2 cups), sautéed spinach, olive oil, side quinoa","Cottage cheese + honey + berries + almonds + warm milk + granola"],
            ["Sun","5-egg scramble, 4 toast, avocado, fruit, milk, oats, nut butter","Greek yogurt + granola + honey + berries + nuts + banana","Grilled salmon (200g), extra large sweet potato, asparagus, olive oil, quinoa side, salad","Apple + peanut butter + crackers + cheese + banana + honey","Paneer tikka (180g), quinoa (2 cups), mixed veg curry, 2-3 rotis, olive oil","Warm milk + 4 dates + almonds + pistachios + honey + handful walnuts"]
        ]
    },
    "100-110kg": {
        title: "100kg → 110kg Target",
        target: "Daily target: ~3,600–3,900 kcal | Protein: 160–220g",
        data: [
            ["Day","Breakfast","Mid-Morning","Lunch","Afternoon","Dinner","Evening"],
            ["Mon","5-egg omelette, 4-5 toast, avocado, banana, oats (1.5 cups), milk, nut butter, honey","Protein shake + walnuts + banana + almonds + chia seeds","Chicken breast (220g), brown rice (3 cups), broccoli, olive oil, quinoa (1 cup), large salad","Greek yogurt + granola + honey + berries + almonds + chia + banana","Beef stir-fry (200g), quinoa (2.5 cups), mixed veggies, avocado, olive oil, side roti","Warm milk + almond butter + 4 dates + almonds + honey + handful walnuts"],
            ["Tue","Oats (1.75 cups dry) w/ protein powder, berries, almonds, milk, banana, nut butter, honey","Hummus + whole wheat pita (2) + cucumber + cheese + olive oil + side fruit","Lentil curry, 4-5 rotis, paneer (180g), large salad, curd, olive oil drizzle, side quinoa","Smoothie: milk, dates, oats, peanut butter, banana, protein powder, chia, honey","Grilled fish (220g), extra large sweet potato, green beans, olive oil, quinoa side, salad","Cottage cheese (300g) + pineapple + honey + almonds + granola"],
            ["Wed","Idli (9-10) + sambar + 4 eggs + milk + fruit + handful nuts + granola + honey","Mixed nuts (60g) + dried fruit + banana + yogurt + honey","Chicken curry (200g), brown rice (2.5 cups), dal, raita, large salad, 2 extra rotis, olive oil","Apple + cheese + whole grain crackers + peanut butter + yogurt + banana + honey","Paneer bhurji (200g), 4-5 parathas, cucumber-tomato salad, curd, avocado, olive oil","Dark chocolate + almonds + warm milk + figs + honey + handful walnuts"],
            ["Thu","Smoothie bowl: mango, banana, oats, chia, protein powder, milk, nut butter, granola, honey","Roasted chana + jaggery + orange + almonds + banana + yogurt","Rajma, brown rice (3 cups), mixed veg, curd, 3 rotis, olive oil, side paneer","Peanut butter banana toast (2 slices) + granola + milk + berries + honey + banana","Baked chicken thighs (220g), quinoa (2.5 cups), roasted carrots, olive oil, large salad, side roti","Warm turmeric milk + figs + walnuts + dates + honey + almonds"],
            ["Fri","Upma w/ extra veggies + 4-5 boiled eggs + curd + fruit + nuts + toast + banana","Trail mix (70g) + orange + banana + yogurt + honey","Fish curry (220g), 3-4 millet rotis, cabbage sabzi, dal, large salad, avocado, olive oil","Yogurt + honey + flaxseeds + granola + berries + banana + almonds","Egg curry (5 eggs), 4-5 whole wheat rotis, large salad, avocado, olive oil, side quinoa","Dates (5) + walnuts + warm milk + almonds + honey + handful cashews"],
            ["Sat","4-5 stuffed parathas + curd + pickle + milk + fruit + nuts + banana + honey","Protein shake + almonds + banana + oats + honey + chia","Chicken biryani (extra large + extra protein), raita, large salad, 3 extra rotis, olive oil","Roasted peanuts + jaggery + banana + cashews + yogurt + honey","Lamb curry (200g), brown rice (2.5 cups), sautéed spinach, olive oil, quinoa side, salad","Cottage cheese + honey + berries + almonds + warm milk + granola + banana"],
            ["Sun","5-egg scramble, 5 toast, avocado, fruit, milk, oats, nut butter, honey, banana","Greek yogurt + granola + honey + berries + nuts + banana + chia","Grilled salmon (220g), extra large sweet potato, asparagus, olive oil, quinoa side, large salad, extra roti","Apple + peanut butter + crackers + cheese + banana + honey + handful almonds","Paneer tikka (200g), quinoa (2.5 cups), mixed veg curry, 3 rotis, olive oil, side salad","Warm milk + 4-5 dates + almonds + pistachios + honey + walnuts + granola"]
        ]
    },
    "110-120kg": {
        title: "110kg → 120kg Target",
        target: "Daily target: ~3,900–4,200+ kcal | Protein: 175–240g",
        data: [
            ["Day","Breakfast","Mid-Morning","Lunch","Afternoon","Dinner","Evening"],
            ["Mon","6-egg omelette, 5 toast, avocado (whole), banana, oats (2 cups), milk, nut butter, honey, berries","Protein shake + walnuts + banana + almonds + chia + honey + extra scoop protein","Chicken breast (250g), brown rice (3.5 cups), broccoli, olive oil, quinoa (1.5 cups), large salad with dressing","Greek yogurt + granola + honey + berries + almonds + chia + banana + nut butter","Beef stir-fry (220g), quinoa (3 cups), mixed veggies, avocado (whole), olive oil, side 2 rotis","Warm milk + almond butter + 4-5 dates + almonds + honey + walnuts + handful cashews"],
            ["Tue","Oats (2 cups dry) w/ protein powder, berries, almonds, milk, banana, nut butter, honey, chia","Hummus + whole wheat pita (2-3) + cucumber + cheese + olive oil + fruit + handful nuts","Lentil curry, 5-6 rotis, paneer (200g), large salad, curd, olive oil drizzle, quinoa side, extra protein","Smoothie: milk, dates, oats, peanut butter, banana, protein powder (double), chia, honey, avocado","Grilled fish (250g), extra large sweet potato (2), green beans, olive oil, quinoa side, large salad","Cottage cheese (350g) + pineapple + honey + almonds + granola + banana"],
            ["Wed","Idli (10-12) + sambar + 5 eggs + milk + fruit + handful nuts + granola + honey + banana","Mixed nuts (70g) + dried fruit + banana + yogurt + honey + chia","Chicken curry (220g), brown rice (3 cups), dal, raita, large salad, 3 extra rotis, olive oil, side paneer","Apple + cheese + whole grain crackers + peanut butter + yogurt + banana + honey + handful almonds","Paneer bhurji (220g), 5-6 parathas, cucumber-tomato salad, curd, avocado, olive oil, side quinoa","Dark chocolate + almonds + warm milk + figs + honey + walnuts + granola"],
            ["Thu","Smoothie bowl: mango, banana, oats, chia, protein powder (double), milk, nut butter, granola, honey, berries","Roasted chana + jaggery + orange + almonds + banana + yogurt + honey + handful walnuts","Rajma, brown rice (3.5 cups), mixed veg, curd, 3-4 rotis, olive oil, side paneer, extra protein","Peanut butter banana toast (3 slices) + granola + milk + berries + honey + banana + almonds","Baked chicken thighs (250g), quinoa (3 cups), roasted carrots, olive oil, large salad, side 2 rotis, avocado","Warm turmeric milk + figs + walnuts + dates + honey + almonds + handful cashews"],
            ["Fri","Upma w/ extra veggies + 5 boiled eggs + curd + fruit + nuts + toast + banana + honey","Trail mix (80g) + orange + banana + yogurt + honey + chia","Fish curry (250g), 4-5 millet rotis, cabbage sabzi, dal, large salad, avocado, olive oil, side quinoa","Yogurt + honey + flaxseeds + granola + berries + banana + almonds + nut butter","Egg curry (5-6 eggs), 5 whole wheat rotis, large salad, avocado, olive oil, quinoa side, extra protein","Dates (5-6) + walnuts + warm milk + almonds + honey + cashews + handful pistachios"],
            ["Sat","5-6 stuffed parathas + curd + pickle + milk + fruit + nuts + banana + honey + extra protein","Protein shake + almonds + banana + oats + honey + chia + extra scoop","Chicken biryani (extra large + double protein), raita, large salad, 4 extra rotis, olive oil, side quinoa","Roasted peanuts + jaggery + banana + cashews + yogurt + honey + handful almonds","Lamb curry (220g), brown rice (3 cups), sautéed spinach, olive oil, quinoa side, large salad, extra roti","Cottage cheese + honey + berries + almonds + warm milk + granola + banana + nut butter"],
            ["Sun","6-egg scramble, 5-6 toast, avocado, fruit, milk, oats, nut butter, honey, banana, berries","Greek yogurt + granola + honey + berries + nuts + banana + chia + honey","Grilled salmon (250g), extra large sweet potato (2), asparagus, olive oil, quinoa side, large salad, 2 extra rotis","Apple + peanut butter + crackers + cheese + banana + honey + almonds + handful walnuts","Paneer tikka (220g), quinoa (3 cups), mixed veg curry, 3-4 rotis, olive oil, side salad, extra protein","Warm milk + 5 dates + almonds + pistachios + honey + walnuts + granola + handful cashews"]
        ]
    }
};

// Diet Excel Export Function
function downloadDietExcel(categoryKey) {
    const plan = dietPlans[categoryKey];
    if (!plan) return;

    const wsData = [
        [plan.title],
        [plan.target],
        [], 
        ...plan.data
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Auto-size columns for readability
    ws['!cols'] = [
        {wch: 8}, {wch: 55}, {wch: 35}, {wch: 50}, 
        {wch: 40}, {wch: 50}, {wch: 35}
    ];

    // Style header row (optional: bold via cell format if needed, SheetJS handles basic styling)
    XLSX.utils.book_append_sheet(wb, ws, plan.title);
    XLSX.writeFile(wb, `Diet_Plan_${categoryKey.replace(/\s/g, '_')}.xlsx`);
    
    document.getElementById('dietMessage').innerText = `✅ Downloaded: ${plan.title}`;
}

// Attach event listeners to diet buttons
document.querySelectorAll('.diet-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const category = this.getAttribute('data-category');
        try {
            downloadDietExcel(category);
            showNotification(`Downloading ${category} meal plan...`, 'success');
        } catch (error) {
            showNotification('Error downloading meal plan. Please try again.', 'error');
            console.error('Diet download error:', error);
        }
    });
});

// Initial chart setup (empty)
renderChart();