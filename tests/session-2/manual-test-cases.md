# Session 2 homework — Manual test cases

Automated in: [homework.spec.ts](homework.spec.ts)
Environment: Toolshop — http://45.77.169.70:4200 · All test cases start **not logged in**.

---

## TC-01 — Sort by price, high to low

| | |
|---|---|
| **Summary** | Choosing the sort option **Price (High - Low)** lists the home page products in descending price order. |
| **Precondition** | The home page shows 9 products in the default order (not sorted by price). |
| **Test data** | Sort option: `Price (High - Low)` |
| **Test steps** | 1. Open the home page `/` <br> 2. In **Sort**, choose **Price (High - Low)** |
| **Expected result** | After step 1: 9 products are shown. <br> After step 2: 9 products are still shown, and each product's price is **greater than or equal to** the price of the next one (e.g. $89.55, $86.71, $80.19, …). |

## TC-02 — Navigate to the Power Tools category

| | |
|---|---|
| **Summary** | Choosing **Categories > Power Tools** in the header opens the category page and lists only Power Tools products. |
| **Precondition** | The home page has finished loading. |
| **Test data** | Category: `Power Tools` <br> Product that must be listed: `Cordless Drill 12V` <br> Products that must not be listed: anything containing `Pliers` (a Hand Tools product) |
| **Test steps** | 1. Open the home page `/` <br> 2. Click **Categories** in the header <br> 3. Click **Power Tools** |
| **Expected result** | After step 3: <br> - The URL is `/category/power-tools` <br> - The page title is **Category: Power Tools** <br> - **Cordless Drill 12V** is listed <br> - **No** product containing "Pliers" is listed |

## TC-03 — Filter eco-friendly products

| | |
|---|---|
| **Summary** | Ticking **Show only eco-friendly products** shows only products with an **ECO** badge. |
| **Precondition** | The home page shows 9 products and the eco-friendly filter is not ticked. |
| **Test data** | Filter: `Show only eco-friendly products` <br> Eco product that must be listed: `Wood Saw` <br> Non-eco product that must disappear: `Combination Pliers` |
| **Test steps** | 1. Open the home page `/` <br> 2. Under **Sustainability**, tick **Show only eco-friendly products** |
| **Expected result** | After step 2: <br> - The **Show only eco-friendly products** checkbox is ticked <br> - **Combination Pliers** is no longer listed <br> - **Wood Saw** is listed <br> - At least 1 product is listed, and **every** product has an **ECO** badge (number of ECO badges = number of products) |
