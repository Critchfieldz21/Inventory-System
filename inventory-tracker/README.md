# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

## XLSX Import Support

The app now supports importing `.xlsx` files for items, sales, and recipes.

### Requirements

- Backend dependency: `openpyxl`
- Install with: `pip install openpyxl`

### Import Endpoints

- `POST /api/items/import_xlsx/`
- `POST /api/sales/import_xlsx/`
- `POST /api/recipes/import_xlsx/`

Use multipart form-data with field name `file`.

### Items XLSX Columns

Required headers:

- `name`
- `category`
- `stock`
- `cost_price`
- `price`

Behavior:

- Existing item name: stock is added to current stock, and category/cost/price are updated.
- New item name: a new item is created.

### Sales XLSX Columns

Required headers:

- `item` (item ID or item name)
- `quantity`
- `total` (optional value per row; if blank, it is computed as `item.price * quantity`)
- `status` (`Pending` or `Completed`)

Optional header:

- `date` (ISO format recommended)

Behavior:

- Each row creates one sales transaction.
- Multiple rows in a single file are supported.

### Recipes XLSX Columns

Required headers:

- `name`
- `ingredients`

Ingredients supported formats:

- JSON list: `[ {"item": "Burger Buns", "quantity": 1}, {"item": "Beef Patties", "quantity": 1} ]`
- Text list: `Burger Buns:1;Beef Patties:1;Cheddar Cheese:1`

Behavior:

- Existing recipe name: ingredients are updated.
- New recipe name: a new recipe is created.
