async function fetchProducts() {
    // Вместо запроса к файлу, создаем массив сразу
    allProducts = [
        {
        "id": 1,
        "article": "JD-772-XP",
        "name": "Гидромотор поворота John Deere",
        "category": "Гидравлика",
        "price": 185000,
        "image": "motor.jpg"
    },
    {
        "id": 2,
        "article": "PN-BC-404",
        "name": "Пильная шина Ponsse 75см",
        "category": "Расходные материалы",
        "price": 12400,
        "image": "motor.jpg"
    },
    {
        "id": 3,
        "article": "KM-FL-99",
        "name": "Фильтр гидравлический Komatsu",
        "category": "Фильтры",
        "price": 5600,
        "image": "filter.jpg"
    }
];
    render(allProducts);
}