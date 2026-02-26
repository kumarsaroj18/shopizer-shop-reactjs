# Shopizer React E-Commerce - Technical Architecture & Request Flow Documentation

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Application Bootstrap & React Internals](#2-application-bootstrap--react-internals)
3. [Redux State Management Flow](#3-redux-state-management-flow)
4. [Component Request Flow Patterns](#4-component-request-flow-patterns)
5. [Key User Journeys with Technical Flow](#5-key-user-journeys-with-technical-flow)
6. [React Rendering & Performance](#6-react-rendering--performance)

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              React Application (SPA)                   │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │         React Router (Client-Side Routing)      │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │    Redux Store (Global State Management)        │  │  │
│  │  │    - Cart State                                  │  │  │
│  │  │    - User State                                  │  │  │
│  │  │    - Product State                               │  │  │
│  │  │    - UI State (Loading, Language)                │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │         React Components Tree                    │  │  │
│  │  │    Pages → Wrappers → Components                 │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│                           ↕                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │    Axios HTTP Client (API Communication Layer)        │  │
│  │    - Request Interceptors (Auth Token Injection)      │  │
│  │    - Response Interceptors (Error Handling)           │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↕ HTTP/HTTPS
┌─────────────────────────────────────────────────────────────┐
│              Shopizer Backend REST API                       │
│              (Java Spring Boot)                              │
└─────────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────────┐
│         External Services                                    │
│  - Stripe Payment Gateway                                    │
│  - Google Maps API                                           │
│  - Email Service                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

**Frontend Framework**: React 16.6.0
- **Virtual DOM**: Efficient UI updates
- **Component-Based**: Reusable UI building blocks
- **Hooks**: State and lifecycle management
- **JSX**: JavaScript XML syntax

**State Management**: Redux 4.0.4
- **Centralized Store**: Single source of truth
- **Predictable State**: Unidirectional data flow
- **Middleware**: Redux Thunk for async operations
- **Persistence**: LocalStorage integration

**Routing**: React Router DOM 5.1.2
- **Client-Side Routing**: No page reloads
- **Dynamic Routes**: Parameter-based navigation
- **History API**: Browser history management

**HTTP Client**: Axios 0.21.1
- **Promise-Based**: Async/await support
- **Interceptors**: Request/response transformation
- **Automatic JSON**: Data transformation

---

## 2. Application Bootstrap & React Internals

### 2.1 Application Initialization Flow

```
Browser Loads index.html
         ↓
Loads env-config.js (window._env_)
         ↓
Loads React Bundle (index.js)
         ↓
┌────────────────────────────────────────┐
│  1. Import Polyfills (IE11 Support)   │
│     - react-app-polyfill/ie11          │
│     - react-app-polyfill/stable        │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  2. Create Redux Store                 │
│     - Combine Reducers                 │
│     - Load Persisted State             │
│     - Apply Middleware (Thunk)         │
│     - Setup DevTools                   │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  3. ReactDOM.render()                  │
│     - Create Virtual DOM Tree          │
│     - Wrap with Redux Provider         │
│     - Mount to DOM (#root)             │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  4. App Component Initialization       │
│     - Setup Router                     │
│     - Setup Providers                  │
│     - Run useEffect Hook               │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  5. Initial Route Rendering            │
│     - Match Current URL                │
│     - Lazy Load Component              │
│     - Render Component Tree            │
└────────────────────────────────────────┘
```

### 2.2 Detailed Bootstrap Process

#### Step 1: index.js Entry Point

**File**: `src/index.js`

```javascript
// 1. Polyfills for older browsers
import "react-app-polyfill/ie11";
import "react-app-polyfill/stable";

// 2. Core React imports
import React from "react";
import ReactDOM from "react-dom";

// 3. Redux setup imports
import { createStore, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import { save, load } from "redux-localstorage-simple";
import { Provider } from "react-redux";
import { composeWithDevTools } from "redux-devtools-extension";

// 4. Application imports
import rootReducer from "./redux/reducers/rootReducer";
import App from "./App";
import "./assets/scss/style.scss";
```

**React Internal Process**:
1. **Module Loading**: Webpack bundles all imports
2. **Dependency Resolution**: React core loaded first
3. **Style Processing**: SASS compiled to CSS, injected into DOM

#### Step 2: Redux Store Creation

```javascript
const store = createStore(
  rootReducer,                    // Combined reducers
  load(),                         // Restore from localStorage
  composeWithDevTools(            // DevTools integration
    applyMiddleware(
      thunk,                      // Async action support
      save()                      // Auto-save to localStorage
    )
  )
);
```

**Redux Store Initialization Flow**:

```
createStore() Called
         ↓
┌────────────────────────────────────────┐
│  1. Initialize State Tree              │
│     - Call each reducer with           │
│       undefined state                  │
│     - Reducers return initial state    │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  2. Load Persisted State               │
│     - Read from localStorage           │
│     - Merge with initial state         │
│     - Hydrate store                    │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  3. Apply Middleware                   │
│     - Wrap dispatch function           │
│     - Thunk: Enable async actions      │
│     - Save: Auto-persist on changes    │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  4. Store Ready                        │
│     - getState() available             │
│     - dispatch() available             │
│     - subscribe() available            │
└────────────────────────────────────────┘
```

**State Persistence Mechanism**:
- **save()**: Middleware that listens to every action
- **On Action Dispatch**: Serializes state to localStorage
- **load()**: Reads localStorage on app start
- **Keys Stored**: `redux_localstorage_simple`

#### Step 3: React Rendering

```javascript
ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById("root")
);
```

**React Rendering Process (Under the Hood)**:

```
ReactDOM.render() Called
         ↓
┌────────────────────────────────────────┐
│  1. Create Root Fiber Node             │
│     - Fiber: React's internal          │
│       representation of component      │
│     - Root fiber points to <Provider>  │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  2. Begin Work Phase                   │
│     - Traverse component tree          │
│     - Create fiber for each component  │
│     - Build Virtual DOM tree           │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  3. Provider Component                 │
│     - Creates Redux Context            │
│     - Makes store available to         │
│       all child components             │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  4. App Component Rendering            │
│     - Execute function component       │
│     - Run hooks (useState, useEffect)  │
│     - Return JSX                       │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  5. Commit Phase                       │
│     - Apply changes to real DOM        │
│     - Run useEffect callbacks          │
│     - Browser paints UI                │
└────────────────────────────────────────┘
```

**React Fiber Architecture**:
- **Fiber**: Unit of work in React
- **Reconciliation**: Comparing old and new Virtual DOM
- **Scheduling**: Prioritizing updates
- **Incremental Rendering**: Breaking work into chunks


### 2.3 App Component Initialization

**File**: `src/App.js`

```javascript
const App = (props) => {
  useEffect(() => {
    // Initialization logic runs after first render
  });

  return (
    <ToastProvider placement="bottom-left">
      <BreadcrumbsProvider>
        <Router>
          <Loader />
          <Cookie />
          <ScrollToTop>
            <Suspense fallback={<PreloaderUI />}>
              <Switch>
                {/* Routes */}
              </Switch>
            </Suspense>
          </ScrollToTop>
        </Router>
      </BreadcrumbsProvider>
    </ToastProvider>
  );
};
```

**Component Hierarchy & React Context Flow**:

```
<Provider store={reduxStore}>          ← Redux Context
  <App>
    <ToastProvider>                    ← Toast Context
      <BreadcrumbsProvider>            ← Breadcrumb Context
        <Router>                       ← Router Context
          <Loader />                   ← Global loader
          <Cookie />                   ← Cookie consent
          <ScrollToTop>                ← Scroll behavior
            <Suspense>                 ← Lazy loading boundary
              <Switch>                 ← Route matching
                <Route />              ← Individual routes
              </Switch>
            </Suspense>
          </ScrollToTop>
        </Router>
      </BreadcrumbsProvider>
    </ToastProvider>
  </App>
</Provider>
```

**useEffect Hook Execution**:

```javascript
useEffect(() => {
  // 1. Restore cart from cookie
  var cart_cookie = window._env_.APP_MERCHANT + '_shopizer_cart';
  const cookies = new Cookies();
  let cookie = cookies.get(cart_cookie);
  if (cookie) {
    props.dispatch(setShopizerCartID(cookie));
  }

  // 2. Set CSS theme color
  document.documentElement.style.setProperty(
    '--theme-color', 
    window._env_.APP_THEME_COLOR
  );

  // 3. Load language translations
  props.dispatch(loadLanguages({
    languages: {
      en: require("./translations/english.json"),
      fr: require("./translations/french.json")
    }
  }));
});
```

**React Hook Lifecycle**:

```
Component Function Executes
         ↓
JSX Returned (Virtual DOM Created)
         ↓
React Commits to Real DOM
         ↓
useEffect Callback Runs
         ↓
┌────────────────────────────────────────┐
│  1. Read Cookie                        │
│     - Access document.cookie           │
│     - Parse cart ID                    │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  2. Dispatch Redux Action              │
│     - setShopizerCartID(cookie)        │
│     - Updates Redux store              │
│     - Triggers re-render               │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  3. Modify DOM Directly                │
│     - Set CSS custom property          │
│     - Applies theme color              │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  4. Load Translations                  │
│     - Dispatch loadLanguages action    │
│     - Updates multilanguage state      │
└────────────────────────────────────────┘
```

**Note**: This useEffect has no dependency array, so it runs after every render. This is intentional to check cart cookie on each render.

---

## 3. Redux State Management Flow

### 3.1 Redux Architecture

**Store Structure**:

```javascript
{
  multilanguage: {
    currentLanguageCode: "en",
    languages: { en: {...}, fr: {...} }
  },
  productData: {
    products: [],
    productid: '',
    categoryid: ''
  },
  merchantData: {
    store: { name, code, currency, ... }
  },
  cartData: {
    cartItems: { code, products: [], quantity, subtotal, total },
    cartID: 'CART-UUID',
    cartCount: 3,
    orderID: ''
  },
  loading: {
    isLoading: false
  },
  userData: {
    userData: { id, email, firstName, ... },
    country: [],
    shipCountry: [],
    state: [],
    shipState: [],
    currentAddress: []
  },
  content: {
    content: { title, description, ... }
  }
}
```

### 3.2 Redux Data Flow Pattern

**Unidirectional Data Flow**:

```
┌─────────────────────────────────────────────────────────────┐
│                    React Component                           │
│  - User clicks "Add to Cart" button                         │
│  - Component calls: dispatch(addToCart(item))               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    Action Creator                            │
│  File: src/redux/actions/cartActions.js                     │
│  - addToCart() function executes                            │
│  - Returns async function (Redux Thunk)                     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    Redux Thunk Middleware                    │
│  - Intercepts function instead of plain object              │
│  - Calls function with dispatch and getState                │
│  - Allows async operations                                  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    Async Operation                           │
│  - API call via Axios                                       │
│  - await WebService.post(action, params)                    │
│  - Receives response from backend                           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    Dispatch Action                           │
│  - dispatch({ type: GET_CART, payload: response })          │
│  - Plain object action sent to reducers                     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    Reducer                                   │
│  File: src/redux/reducers/cartReducer.js                    │
│  - Receives action and current state                        │
│  - Returns new state (immutable)                            │
│  - Does NOT mutate existing state                           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    Redux Store                               │
│  - State updated with new cart data                         │
│  - Notifies all subscribers                                 │
│  - Persists to localStorage (save middleware)               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    React-Redux                               │
│  - useSelector hooks detect state change                    │
│  - Components using cart data re-render                     │
│  - Virtual DOM diff calculated                              │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    React Reconciliation                      │
│  - Compare old and new Virtual DOM                          │
│  - Calculate minimal DOM updates                            │
│  - Apply changes to real DOM                                │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    Browser Re-paint                          │
│  - Cart count badge updates                                 │
│  - Cart dropdown shows new item                             │
│  - User sees updated UI                                     │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Detailed Action Flow: Add to Cart

**File**: `src/redux/actions/cartActions.js`

```javascript
export const addToCart = (
  item, 
  addToast, 
  cartId, 
  quantityCount, 
  defaultStore, 
  userData, 
  selectedProductOptions
) => {
  return async dispatch => {
    // Step 1: Show loading indicator
    dispatch(setLoader(true));
    
    try {
      // Step 2: Prepare API request
      let action, param, response, message;
      
      if (selectedProductOptions !== undefined) {
        param = { 
          "attributes": selectedProductOptions, 
          "product": item.sku, 
          "quantity": quantityCount 
        };
      } else {
        param = { 
          "product": item.sku, 
          "quantity": quantityCount 
        };
      }
      
      // Step 3: Determine API endpoint
      if (cartId) {
        // Update existing cart
        message = "Updated Cart";
        action = constant.ACTION.CART + cartId + '?store=' + window._env_.APP_MERCHANT;
        response = await WebService.put(action, param);
      } else {
        // Create new cart
        message = "Added Cart";
        action = constant.ACTION.CART + '?store=' + window._env_.APP_MERCHANT;
        response = await WebService.post(action, param);
      }
      
      // Step 4: Process response
      if (response) {
        // Save cart ID
        dispatch(setShopizerCartID(response.code));
        
        // Hide loading
        dispatch(setLoader(false));
        
        // Refresh cart data
        if (userData) {
          setTimeout(() => {
            dispatch(getCart(response.code, userData));
          }, 2000);
        } else {
          dispatch(getCart(response.code, userData));
        }
        
        // Show success message
        if (addToast) {
          addToast(message, { 
            appearance: "success", 
            autoDismiss: true 
          });
        }
      }
    } catch (error) {
      dispatch(setLoader(false));
    }
  };
};
```

**Action Flow Breakdown**:

```
User Clicks "Add to Cart"
         ↓
Component: dispatch(addToCart(...))
         ↓
┌────────────────────────────────────────┐
│  Action Creator Returns Function       │
│  (Redux Thunk intercepts)              │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Dispatch: setLoader(true)             │
│  - Reducer updates loading state       │
│  - Loader component shows spinner      │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Prepare Request Parameters            │
│  - Build param object                  │
│  - Include product SKU, quantity       │
│  - Include selected options            │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Determine API Endpoint                │
│  - If cartId exists: PUT (update)      │
│  - If no cartId: POST (create)         │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  API Call via WebService               │
│  - Axios request sent                  │
│  - Request interceptor adds auth       │
│  - Wait for response                   │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Response Received                     │
│  - Cart object with code               │
│  - Updated products array              │
│  - New totals                          │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Dispatch: setShopizerCartID()         │
│  - Saves cart ID to Redux              │
│  - Saves cart ID to cookie             │
│  - Cookie expires in 6 months          │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Dispatch: getCart()                   │
│  - Fetches complete cart data          │
│  - Updates cartData in Redux           │
│  - Updates cart count                  │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Dispatch: setLoader(false)            │
│  - Hides loading spinner               │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Show Toast Notification               │
│  - Success message displayed           │
│  - Auto-dismiss after timeout          │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  React Re-renders                      │
│  - Cart badge updates                  │
│  - Cart dropdown refreshes             │
│  - UI reflects new state               │
└────────────────────────────────────────┘
```

### 3.4 Reducer Pattern

**File**: `src/redux/reducers/cartReducer.js`

```javascript
const initState = {
  cartItems: {},
  cartID: '',
  cartCount: 0,
  orderID: ''
};

const cartReducer = (state = initState, action) => {
  if (action.type === GET_CART) {
    return {
      ...state,
      cartItems: Object.assign({}, action.payload),
      cartCount: action.payload.quantity
    };
  }
  
  if (action.type === DELETE_FROM_CART) {
    let index = state.cartItems.products.findIndex(
      order => order.id === action.payload.id
    );
    state.cartItems.products.splice(index, 1);
    
    if (state.cartItems.products.length === 0) {
      // Clear cart completely
      return {
        ...state,
        cartItems: {},
        cartCount: 0,
        cartID: ''
      };
    } else {
      return {
        ...state,
        cartCount: state.cartItems.products.length,
        cartItems: state.cartItems
      };
    }
  }
  
  return state;
};
```

**Reducer Principles**:
1. **Pure Function**: Same input always produces same output
2. **Immutability**: Never mutate state directly
3. **Spread Operator**: Create new objects `{...state}`
4. **Default State**: Return current state if action not handled



---

## 4. Component Request Flow Patterns

### 4.1 Page Component Lifecycle: Category Page

**File**: `src/pages/category/Category.js`

**Complete Request Flow**:

```
User Navigates to /category/electronics
         ↓
┌────────────────────────────────────────┐
│  React Router Matches Route            │
│  <Route path="/category/:id"           │
│         component={Category} />        │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  React.lazy() Triggers                 │
│  - Dynamic import() called             │
│  - Webpack loads chunk                 │
│  - Suspense shows fallback             │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Category Component Loaded             │
│  - Function component executes         │
│  - Hooks initialized                   │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  useState Hooks Initialize             │
│  const [layout, setLayout] = useState  │
│  const [productData, setProductData]   │
│  const [totalProduct, setTotalProduct] │
│  ... (multiple state variables)        │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  useSelector Hooks Connect Redux       │
│  const { categoryID } = useSelector(   │
│    state => state.productData          │
│  );                                    │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Component Returns JSX                 │
│  - Virtual DOM created                 │
│  - Initial render with loading state   │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  React Commits to DOM                  │
│  - Layout component rendered           │
│  - Breadcrumb rendered                 │
│  - Sidebar rendered                    │
│  - Product grid placeholder            │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  useEffect Hook Executes               │
│  useEffect(() => {                     │
│    getProductList(categoryID, [], []); │
│  }, [categoryID, offset]);             │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  getProductList() Function Called      │
│  - Async function                      │
│  - Builds API endpoint                 │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Dispatch: setLoader(true)             │
│  - Global loader shows                 │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  API Request Built                     │
│  let action = constant.ACTION.PRODUCTS │
│    + '?store=' + merchant              │
│    + '&lang=' + language               │
│    + '&category=' + categoryID         │
│    + '&count=' + pageLimit             │
│    + '&page=' + currentPage            │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  WebService.get(action)                │
│  - Axios GET request                   │
│  - Request interceptor adds token      │
│  - Sent to backend API                 │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Backend Processing                    │
│  - Query database                      │
│  - Apply filters                       │
│  - Paginate results                    │
│  - Return JSON response                │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Response Received                     │
│  {                                     │
│    products: [...],                    │
│    recordsTotal: 45,                   │
│    recordsFiltered: 45                 │
│  }                                     │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  State Updates (Multiple)              │
│  setProductData(response.products)     │
│  setTotalProduct(response.recordsTotal)│
│  setLoader(false)                      │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  React Re-render Triggered             │
│  - State changed, component re-runs    │
│  - New Virtual DOM created             │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  React Reconciliation                  │
│  - Diff old vs new Virtual DOM         │
│  - Identify changed elements           │
│  - Minimal DOM updates calculated      │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  DOM Updates Applied                   │
│  - Loader hidden                       │
│  - Product grid populated              │
│  - Pagination rendered                 │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Browser Paints                        │
│  - User sees products                  │
│  - Images start loading                │
│  - Page interactive                    │
└────────────────────────────────────────┘
```

**Category Component Code**:

```javascript
const Category = ({ 
  setCategoryID, 
  isLoading, 
  strings, 
  location, 
  defaultStore, 
  currentLanguageCode, 
  categoryID, 
  setLoader 
}) => {
  // Local state
  const [layout, setLayout] = useState('grid three-column');
  const [productData, setProductData] = useState([]);
  const [totalProduct, setTotalProduct] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const pageLimit = parseInt(window._env_.APP_PRODUCT_GRID_LIMIT) || 12;
  
  // Effect runs when categoryID or offset changes
  useEffect(() => {
    setCategoryValue(categoryID);
    setSubCategory([]);
    setColor([]);
    setManufacture([]);
    setSize([]);
    setSelectedManufature([]);
    setSelectedOption([]);
    getProductList(categoryID, [], []);
  }, [categoryID, offset]);
  
  // Fetch products from API
  const getProductList = async (category, options, manufacturers) => {
    setLoader(true);
    
    let action = constant.ACTION.PRODUCTS 
      + '?store=' + defaultStore 
      + '&lang=' + currentLanguageCode 
      + '&category=' + category 
      + '&count=' + pageLimit 
      + '&page=' + currentPage;
    
    // Add filters if present
    if (options.length > 0) {
      action += '&options=' + options.join(',');
    }
    if (manufacturers.length > 0) {
      action += '&manufacturers=' + manufacturers.join(',');
    }
    
    try {
      let response = await WebService.get(action);
      if (response) {
        setProductData(response.products);
        setTotalProduct(response.recordsTotal);
        setProductDetails(response);
        setSubCategory(response.categoryFacets || []);
        setManufacture(response.manufacturerFacets || []);
        setColor(response.optionFacets?.color || []);
        setSize(response.optionFacets?.size || []);
        setLoader(false);
      }
    } catch (error) {
      setLoader(false);
    }
  };
  
  return (
    <Layout>
      <Breadcrumb />
      <div className="shop-area">
        <div className="container">
          <div className="row">
            <div className="col-lg-3">
              <ShopSidebar 
                products={productData}
                getSortParams={getSortParams}
                getCategoryParams={getCategoryParams}
                subCategory={subCategory}
                manufacture={manufacture}
                color={color}
                size={size}
              />
            </div>
            <div className="col-lg-9">
              <ShopTopbar 
                getLayout={getLayout}
                productCount={totalProduct}
              />
              <ShopProducts 
                layout={layout}
                products={productData}
              />
              <ReactPaginate 
                pageCount={Math.ceil(totalProduct / pageLimit)}
                onPageChange={handlePageClick}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
```

### 4.2 HTTP Request Flow with Axios

**File**: `src/util/webService.js`

**WebService Wrapper**:

```javascript
const BASE_URL = window._env_.APP_BASE_URL + window._env_.APP_API_VERSION;
axios.defaults.baseURL = BASE_URL;

export default class WebService {
  static async get(action) {
    let response = await axios.get(action);
    return response.data;
  }
  
  static async post(action, params) {
    let response = await axios.post(action, params);
    return response.data;
  }
  
  static async put(action, params) {
    let response = await axios.put(action, params);
    return response.data;
  }
  
  static async delete(action) {
    let response = await axios.delete(action);
    return response.data;
  }
}
```

**Axios Interceptor Flow**:

```
Component Calls WebService.get(action)
         ↓
┌────────────────────────────────────────┐
│  Axios Request Created                 │
│  - Method: GET                         │
│  - URL: BASE_URL + action              │
│  - Headers: {}                         │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Request Interceptor Executes          │
│  axios.interceptors.request.use()      │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Interceptor Logic                     │
│  1. Set baseURL                        │
│  2. Get token from localStorage        │
│  3. Add Authorization header           │
│     config.headers.common[             │
│       'Authorization'                  │
│     ] = 'Bearer ' + token              │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  HTTP Request Sent                     │
│  GET http://localhost:8080/api/v1/     │
│      products?store=DEFAULT&...        │
│  Headers:                              │
│    Authorization: Bearer eyJhbG...     │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Backend Processes Request             │
│  - Validates JWT token                 │
│  - Executes business logic             │
│  - Queries database                    │
│  - Formats response                    │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  HTTP Response Received                │
│  Status: 200 OK                        │
│  Content-Type: application/json        │
│  Body: { products: [...], ... }        │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Response Interceptor Executes         │
│  axios.interceptors.response.use()     │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Success Path (2xx status)             │
│  - Return response as-is               │
│  - No transformation                   │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  WebService Returns response.data      │
│  - Extracts data from response         │
│  - Returns to caller                   │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Component Receives Data               │
│  - Updates state                       │
│  - Triggers re-render                  │
└────────────────────────────────────────┘
```

**Error Handling Flow**:

```
HTTP Error Response (401, 404, 500, etc.)
         ↓
┌────────────────────────────────────────┐
│  Response Interceptor Error Handler    │
│  axios.interceptors.response.use(      │
│    successHandler,                     │
│    errorHandler  ← Executes here       │
│  )                                     │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Check Error Status                    │
│  if (response.status === 401) {        │
│    // Unauthorized                     │
│  } else if (response.status === 404) { │
│    // Not found                        │
│  }                                     │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Return Promise.reject(error)          │
│  - Error propagates to caller          │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Component Catch Block                 │
│  try {                                 │
│    await WebService.get(action);       │
│  } catch (error) {                     │
│    setLoader(false);  ← Executes       │
│    // Handle error                     │
│  }                                     │
└────────────────────────────────────────┘
```

**Request Interceptor Code**:

```javascript
axios.interceptors.request.use(async (config) => {
  // Set base URL
  config.baseURL = BASE_URL;
  
  // Get auth token from localStorage
  const token = await getLocalData("token");
  
  // Add Authorization header if token exists
  config.headers.common['Authorization'] = token ? 'Bearer ' + token : '';
  
  return config;
}, (error) => {
  return Promise.reject(error);
});
```

**Response Interceptor Code**:

```javascript
axios.interceptors.response.use((response) => {
  // Success: return response as-is
  return response;
}, (error) => {
  const { response } = error;
  
  if (response.status === 401 || response.status === 404) {
    // Handle unauthorized or not found
    return Promise.reject(error);
  } else {
    // Handle other errors
    return Promise.reject(error);
  }
});
```

### 4.3 Component Communication Patterns

**Pattern 1: Props Down**

```
Parent Component (Category)
         ↓ (passes props)
Child Component (ShopProducts)
         ↓ (passes props)
Grandchild Component (ProductGridSingle)
```

**Example**:

```javascript
// Parent: Category.js
<ShopProducts 
  layout={layout}
  products={productData}
/>

// Child: ShopProducts.js
const ShopProducts = ({ layout, products }) => {
  return (
    <div className={layout}>
      {products.map(product => (
        <ProductGridSingle 
          key={product.id}
          product={product}
        />
      ))}
    </div>
  );
};

// Grandchild: ProductGridSingle.js
const ProductGridSingle = ({ product }) => {
  return (
    <div className="product-wrap">
      <h3>{product.description.name}</h3>
      <p>${product.price}</p>
    </div>
  );
};
```

**Pattern 2: Callbacks Up**

```
Child Component (ShopSidebar)
         ↑ (calls callback)
Parent Component (Category)
         ↑ (updates state)
Redux Store (if needed)
```

**Example**:

```javascript
// Parent: Category.js
const getSortParams = (sortType, sortValue) => {
  // Update filters
  let tempSelectedOption = selectedOption;
  if (sortType === 'color') {
    tempSelectedOption = [...selectedOption, sortValue];
  }
  setSelectedOption(tempSelectedOption);
  
  // Fetch new data
  getProductList(categoryValue, tempSelectedOption, selectedManufature);
};

<ShopSidebar 
  getSortParams={getSortParams}
  color={color}
/>

// Child: ShopSidebar.js
const ShopSidebar = ({ getSortParams, color }) => {
  return (
    <div>
      {color.map(c => (
        <button onClick={() => getSortParams('color', c.value)}>
          {c.name}
        </button>
      ))}
    </div>
  );
};
```

**Pattern 3: Redux for Global State**

```
Component A (Header/IconGroup)
         ↓ (useSelector)
Redux Store (cartData)
         ↑ (dispatch action)
Component B (ProductDetail)
```

**Example**:

```javascript
// Component A: IconGroup.js (Header)
const IconGroup = ({ cartData, cartCount }) => {
  return (
    <div className="cart-icon">
      <span className="count">{cartCount}</span>
    </div>
  );
};

const mapStateToProps = state => ({
  cartData: state.cartData.cartItems,
  cartCount: state.cartData.cartCount
});

export default connect(mapStateToProps)(IconGroup);

// Component B: ProductDetail.js
const ProductDetail = () => {
  const dispatch = useDispatch();
  
  const handleAddToCart = () => {
    dispatch(addToCart(product, addToast, cartId, quantity));
  };
  
  return (
    <button onClick={handleAddToCart}>Add to Cart</button>
  );
};
```



---

## 5. Key User Journeys with Technical Flow

### 5.1 Complete User Journey: Browse → Add to Cart → Checkout

**Journey Overview**:

```
Home Page → Category Page → Product Detail → Add to Cart → 
Cart Page → Checkout → Payment → Order Confirmation
```

#### Step 1: Home Page Load

```
User Opens Browser → http://localhost:3000/
         ↓
┌────────────────────────────────────────┐
│  DNS Resolution & HTTP Request         │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Server Returns index.html             │
│  - Loads env-config.js                 │
│  - Loads React bundle                  │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  React App Initializes                 │
│  - Redux store created                 │
│  - State loaded from localStorage      │
│  - Cart ID loaded from cookie          │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Router Matches "/" Route              │
│  - Lazy loads Home component           │
│  - Suspense shows loader               │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Home Component Renders                │
│  - Layout wrapper                      │
│  - HeroSlider component                │
│  - TabProduct component                │
│  - Promo component                     │
│  - Newsletter component                │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  TabProduct useEffect Runs             │
│  - Fetches featured products           │
│  - API: GET /products/group/FEATURED   │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Products Displayed                    │
│  - Product grid rendered               │
│  - Images lazy loaded                  │
│  - User sees home page                 │
└────────────────────────────────────────┘
```

#### Step 2: Navigate to Category

```
User Clicks "Electronics" Category Link
         ↓
┌────────────────────────────────────────┐
│  React Router Navigation               │
│  - history.push('/category/electronics')│
│  - No page reload                      │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Router Matches /category/:id          │
│  - Extracts id = "electronics"         │
│  - Lazy loads Category component       │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Category Component Mounts             │
│  - useState hooks initialize           │
│  - useEffect triggers                  │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  getProductList() Called               │
│  - Builds API URL with filters         │
│  - dispatch(setLoader(true))           │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  API Request                           │
│  GET /products?store=DEFAULT           │
│      &lang=en                          │
│      &category=electronics             │
│      &count=15&page=0                  │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Backend Processes                     │
│  - Queries products table              │
│  - Filters by category                 │
│  - Applies pagination                  │
│  - Returns JSON                        │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Response Processed                    │
│  - setProductData(response.products)   │
│  - setTotalProduct(response.total)     │
│  - dispatch(setLoader(false))          │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  React Re-renders                      │
│  - Virtual DOM diff                    │
│  - Product grid updates                │
│  - Pagination rendered                 │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  User Sees Products                    │
│  - 15 products displayed               │
│  - Filters available in sidebar        │
│  - Can change layout/sort              │
└────────────────────────────────────────┘
```

#### Step 3: View Product Details

```
User Clicks Product "iPhone 13"
         ↓
┌────────────────────────────────────────┐
│  Navigate to Product Detail            │
│  - history.push('/product/123')        │
│  - Redux: dispatch(setProductID(123))  │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Router Matches /product/:id           │
│  - Lazy loads ProductDetail component  │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  ProductDetail Component Mounts        │
│  - useEffect runs                      │
│  - getProductDetails() called          │
│  - getReview() called                  │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Parallel API Calls                    │
│  1. GET /products/123?lang=en          │
│  2. GET /products/123/reviews          │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Product Data Received                 │
│  {                                     │
│    id: 123,                            │
│    sku: "IPHONE13",                    │
│    description: { name, desc },        │
│    price: 999,                         │
│    images: [...],                      │
│    options: [                          │
│      { name: "Color", values: [...] }, │
│      { name: "Storage", values: [...] }│
│    ]                                   │
│  }                                     │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Component State Updated               │
│  - setProductDetails(response)         │
│  - setProductReview(reviews)           │
│  - Re-render triggered                 │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Product Detail Rendered               │
│  - ProductImageGallery (left)          │
│  - ProductDescriptionInfo (right)      │
│  - ProductDescriptionTab (bottom)      │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  User Interacts                        │
│  - Selects color: "Blue"               │
│  - Selects storage: "256GB"            │
│  - Sets quantity: 1                    │
│  - Local state updated                 │
└────────────────────────────────────────┘
```

#### Step 4: Add to Cart

```
User Clicks "Add to Cart" Button
         ↓
┌────────────────────────────────────────┐
│  Event Handler Executes                │
│  const handleAddToCart = () => {       │
│    dispatch(addToCart(                 │
│      product,                          │
│      addToast,                         │
│      cartId,                           │
│      quantity,                         │
│      defaultStore,                     │
│      userData,                         │
│      selectedOptions                   │
│    ));                                 │
│  };                                    │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Redux Action Creator                  │
│  - addToCart() returns async function  │
│  - Redux Thunk intercepts              │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Show Loading Indicator                │
│  - dispatch(setLoader(true))           │
│  - Loader component shows spinner      │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Prepare Request                       │
│  param = {                             │
│    product: "IPHONE13",                │
│    quantity: 1,                        │
│    attributes: [                       │
│      { id: 1, value: "Blue" },         │
│      { id: 2, value: "256GB" }         │
│    ]                                   │
│  }                                     │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Determine Endpoint                    │
│  if (cartId exists) {                  │
│    PUT /cart/{cartId}  // Update       │
│  } else {                              │
│    POST /cart  // Create new           │
│  }                                     │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  API Call via Axios                    │
│  POST /cart?store=DEFAULT              │
│  Body: { product, quantity, attributes }│
│  Headers: { Authorization: Bearer ... }│
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Backend Processing                    │
│  1. Validate product exists            │
│  2. Check inventory                    │
│  3. Create/update cart                 │
│  4. Calculate totals                   │
│  5. Return cart object                 │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Response Received                     │
│  {                                     │
│    code: "CART-UUID-123",              │
│    products: [                         │
│      {                                 │
│        id: 1,                          │
│        productId: 123,                 │
│        sku: "IPHONE13",                │
│        quantity: 1,                    │
│        price: 999,                     │
│        attributes: [...]               │
│      }                                 │
│    ],                                  │
│    quantity: 1,                        │
│    subtotal: 999,                      │
│    total: 999                          │
│  }                                     │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Save Cart ID                          │
│  - dispatch(setShopizerCartID(code))   │
│  - Saves to Redux store                │
│  - Saves to cookie (6 month expiry)    │
│  - Cookie: DEFAULT_shopizer_cart       │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Refresh Cart Data                     │
│  - dispatch(getCart(cartId, userData)) │
│  - Fetches complete cart               │
│  - Updates Redux cartData              │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Hide Loading & Show Toast             │
│  - dispatch(setLoader(false))          │
│  - addToast("Added to Cart", success)  │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  React Re-renders Affected Components  │
│  - Header cart badge: 0 → 1            │
│  - Cart dropdown updates               │
│  - Toast notification appears          │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  User Sees Feedback                    │
│  - Cart count badge shows "1"          │
│  - Success toast: "Added to Cart"      │
│  - Can continue shopping               │
└────────────────────────────────────────┘
```

#### Step 5: View Cart

```
User Clicks Cart Icon in Header
         ↓
┌────────────────────────────────────────┐
│  Navigate to Cart Page                 │
│  - history.push('/cart')               │
│  - Router matches /cart route          │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Cart Component Lazy Loaded            │
│  - Suspense shows fallback             │
│  - Component chunk downloaded          │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Cart Component Mounts                 │
│  - useSelector gets cart from Redux    │
│  - const { cartItems, cartCount }      │
│    = useSelector(state => state.cart)  │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Cart Data Already in Redux            │
│  - No API call needed                  │
│  - Data from previous addToCart        │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Cart Rendered                         │
│  - Product list with images            │
│  - Quantity selectors                  │
│  - Remove buttons                      │
│  - Subtotal, tax, total                │
│  - "Proceed to Checkout" button        │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  User Can Modify Cart                  │
│  - Update quantity                     │
│  - Remove items                        │
│  - Each action triggers API call       │
│  - Redux state updated                 │
└────────────────────────────────────────┘
```

#### Step 6: Checkout Process

```
User Clicks "Proceed to Checkout"
         ↓
┌────────────────────────────────────────┐
│  Check Authentication                  │
│  if (!userData) {                      │
│    // Redirect to login or            │
│    // Continue as guest                │
│  }                                     │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Navigate to Checkout                  │
│  - history.push('/checkout')           │
│  - Checkout component loads            │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Checkout Component Initialization     │
│  - useForm hook for form management    │
│  - Load saved addresses (if logged in) │
│  - Fetch countries for dropdown        │
│  - Initialize Stripe                   │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Fetch Countries API                   │
│  GET /country?store=DEFAULT&lang=en    │
│  - dispatch(getCountry(lang))          │
│  - Updates userData.country in Redux   │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Render Checkout Form                  │
│  - Billing address section             │
│  - Shipping address section            │
│  - Shipping method selection           │
│  - Payment section (Stripe)            │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  User Fills Billing Address            │
│  - React Hook Form validation          │
│  - Real-time error messages            │
│  - Country selection triggers          │
│    state/province fetch                │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Fetch States for Selected Country     │
│  GET /zones?code=US                    │
│  - dispatch(getState('US'))            │
│  - Updates userData.state in Redux     │
│  - State dropdown populated            │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  User Fills Shipping Address           │
│  - Can use same as billing             │
│  - Or enter different address          │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Fetch Shipping Methods                │
│  POST /shipping                        │
│  Body: { address, items }              │
│  Response: [                           │
│    { code: "STANDARD", cost: 10 },     │
│    { code: "EXPRESS", cost: 25 }       │
│  ]                                     │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  User Selects Shipping Method          │
│  - Radio button selection              │
│  - Total recalculated                  │
│  - State updated                       │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  User Enters Payment Info              │
│  - Stripe CardElement component        │
│  - Secure iframe for card details      │
│  - PCI compliant                       │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  User Clicks "Place Order"             │
│  - Form validation runs                │
│  - All fields checked                  │
│  - If valid, proceed                   │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Create Payment Intent (Stripe)        │
│  - stripe.createPaymentMethod()        │
│  - Tokenizes card details              │
│  - Returns payment method ID           │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Submit Order to Backend               │
│  POST /checkout                        │
│  Body: {                               │
│    cart: cartId,                       │
│    billing: {...},                     │
│    shipping: {...},                    │
│    shippingMethod: "STANDARD",         │
│    payment: {                          │
│      type: "STRIPE",                   │
│      token: paymentMethodId            │
│    }                                   │
│  }                                     │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Backend Order Processing              │
│  1. Validate cart                      │
│  2. Check inventory                    │
│  3. Create order record                │
│  4. Process payment via Stripe         │
│  5. Decrement inventory                │
│  6. Send confirmation email            │
│  7. Return order details               │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Order Response Received               │
│  {                                     │
│    orderId: "ORD-12345",               │
│    status: "COMPLETED",                │
│    total: 1009,                        │
│    items: [...],                       │
│    confirmationEmail: "sent"           │
│  }                                     │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Clear Cart                            │
│  - dispatch(deleteAllFromCart(orderId))│
│  - Removes cart from Redux             │
│  - Deletes cart cookie                 │
│  - Clears localStorage                 │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Navigate to Confirmation              │
│  - history.push('/order-confirm')      │
│  - Pass order ID in state              │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Order Confirmation Page               │
│  - Thank you message                   │
│  - Order number displayed              │
│  - Order summary                       │
│  - Email confirmation notice           │
│  - Link to order tracking              │
└────────────────────────────────────────┘
```



### 5.2 Authentication Flow: Login

```
User Navigates to /login
         ↓
┌────────────────────────────────────────┐
│  LoginRegister Component Loads         │
│  - Renders login form                  │
│  - useForm hook for validation         │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  User Enters Credentials               │
│  - Email: user@example.com             │
│  - Password: ********                  │
│  - Form validation on blur             │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  User Clicks "Login" Button            │
│  - onSubmit handler executes           │
│  - Form validation runs                │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Hash Password (Client-Side)           │
│  - Uses js-sha512 library              │
│  - const hashedPassword =              │
│      sha512(password)                  │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  API Call: Login                       │
│  POST /auth/login                      │
│  Body: {                               │
│    username: "user@example.com",       │
│    password: "hashed_password"         │
│  }                                     │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Backend Authentication                │
│  1. Validate credentials               │
│  2. Generate JWT token                 │
│  3. Set token expiration               │
│  4. Return user data + token           │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Response Received                     │
│  {                                     │
│    token: "eyJhbGciOiJIUzI1...",       │
│    user: {                             │
│      id: 1,                            │
│      email: "user@example.com",        │
│      firstName: "John",                │
│      lastName: "Doe"                   │
│    }                                   │
│  }                                     │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Store Authentication Data             │
│  - setLocalData('token', response.token)│
│  - dispatch(setUser(response.user))    │
│  - Token saved to localStorage         │
│  - User data saved to Redux            │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Merge Guest Cart with User Cart       │
│  if (guestCartId) {                    │
│    GET /auth/customer/cart?cart=...    │
│    // Backend merges carts             │
│  }                                     │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Fetch User Cart                       │
│  - dispatch(getCart(cartId, userData)) │
│  - Updates Redux with merged cart      │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Start Idle Timer                      │
│  - IdleTimer component activates       │
│  - 30-minute timeout                   │
│  - Monitors user activity              │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Navigate to Account Page              │
│  - history.push('/my-account')         │
│  - User sees dashboard                 │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Subsequent API Calls                  │
│  - Axios interceptor adds token        │
│  - Authorization: Bearer {token}       │
│  - All requests authenticated          │
└────────────────────────────────────────┘
```

**Session Management**:

```
User Logged In (Active)
         ↓
┌────────────────────────────────────────┐
│  IdleTimer Monitoring                  │
│  - Tracks mouse movement               │
│  - Tracks keyboard input               │
│  - Tracks scroll events                │
│  - Resets timer on activity            │
└────────────────────────────────────────┘
         ↓
User Inactive for 30 Minutes
         ↓
┌────────────────────────────────────────┐
│  IdleTimer onIdle Callback             │
│  - Executes logout function            │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Logout Process                        │
│  - dispatch(setUser(''))               │
│  - setLocalData('token', '')           │
│  - Clear Redux user state              │
│  - Clear localStorage token            │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Redirect to Home                      │
│  - history.push('/')                   │
│  - User sees logged-out state          │
└────────────────────────────────────────┘
```

---

## 6. React Rendering & Performance

### 6.1 React Rendering Cycle

**Initial Render**:

```
Component Function Called
         ↓
┌────────────────────────────────────────┐
│  1. Execute Function Body              │
│     - Run hooks in order               │
│     - useState returns initial state   │
│     - useEffect schedules callback     │
│     - useSelector reads Redux          │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  2. Return JSX                         │
│     - JSX transpiled to React.createElement│
│     - Creates Virtual DOM elements     │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  3. React Fiber Work                   │
│     - Build fiber tree                 │
│     - Process each fiber node          │
│     - Mark effects (DOM changes)       │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  4. Commit Phase                       │
│     - Apply DOM changes                │
│     - Run useLayoutEffect              │
│     - Browser paints                   │
│     - Run useEffect                    │
└────────────────────────────────────────┘
```

**Re-render Trigger**:

```
State Change or Props Change
         ↓
┌────────────────────────────────────────┐
│  React Schedules Update                │
│  - Marks component as dirty            │
│  - Adds to update queue                │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Component Function Re-executes        │
│  - Hooks return current state          │
│  - New JSX returned                    │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Reconciliation (Diffing)              │
│  - Compare old Virtual DOM             │
│  - Compare new Virtual DOM             │
│  - Identify changes                    │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Minimal DOM Updates                   │
│  - Only changed elements updated       │
│  - Batch updates for performance       │
└────────────────────────────────────────┘
```

### 6.2 Virtual DOM Reconciliation

**Example: Cart Count Update**:

```
Old Virtual DOM:
<span className="count">2</span>

New Virtual DOM:
<span className="count">3</span>

Diff Algorithm:
1. Same element type (span) ✓
2. Same className ✓
3. Different text content ✗

DOM Update:
element.textContent = "3"  // Only this changes
```

**React Reconciliation Algorithm**:

1. **Element Type Comparison**:
   - Same type: Update props
   - Different type: Unmount old, mount new

2. **Key Prop for Lists**:
   ```javascript
   {products.map(product => (
     <ProductCard key={product.id} product={product} />
   ))}
   ```
   - Keys help React identify which items changed
   - Prevents unnecessary re-renders
   - Maintains component state

3. **Component Comparison**:
   - Same component: Update props
   - Different component: Unmount and remount

### 6.3 Performance Optimizations

**1. Code Splitting with React.lazy()**:

```javascript
const Category = lazy(() => import("./pages/category/Category"));
```

**How it Works**:
- Webpack creates separate bundle for Category
- Bundle loaded only when route accessed
- Reduces initial bundle size
- Faster initial page load

**Bundle Structure**:
```
main.chunk.js          // Core React + Redux
0.chunk.js             // Home page
1.chunk.js             // Category page
2.chunk.js             // Product detail page
...
```

**2. Suspense for Loading States**:

```javascript
<Suspense fallback={<Loader />}>
  <Switch>
    <Route path="/category/:id" component={Category} />
  </Switch>
</Suspense>
```

**Suspense Flow**:
```
Route Matched → lazy() Import Triggered → Suspense Detects Loading
→ Shows Fallback → Chunk Downloaded → Component Rendered
```

**3. Redux State Persistence**:

```javascript
import { save, load } from "redux-localstorage-simple";

const store = createStore(
  rootReducer,
  load(),  // Load on init
  applyMiddleware(thunk, save())  // Save on every action
);
```

**Persistence Flow**:
```
Action Dispatched → Reducer Updates State → save() Middleware
→ Serialize State → localStorage.setItem() → State Persisted
```

**4. Memoization (Not Currently Used, but Recommended)**:

```javascript
// Prevent unnecessary re-renders
const ProductCard = React.memo(({ product }) => {
  return <div>{product.name}</div>;
});

// Memoize expensive calculations
const totalPrice = useMemo(() => {
  return cartItems.reduce((sum, item) => sum + item.price, 0);
}, [cartItems]);

// Memoize callback functions
const handleAddToCart = useCallback(() => {
  dispatch(addToCart(product));
}, [product, dispatch]);
```

### 6.4 React Hooks Execution Order

**Component with Multiple Hooks**:

```javascript
const Category = () => {
  // 1. useState hooks (in order)
  const [layout, setLayout] = useState('grid');
  const [products, setProducts] = useState([]);
  
  // 2. useSelector hooks
  const categoryID = useSelector(state => state.productData.categoryid);
  
  // 3. useEffect hooks (scheduled, run after render)
  useEffect(() => {
    fetchProducts();
  }, [categoryID]);
  
  // 4. Return JSX
  return <div>...</div>;
};
```

**Execution Order**:

```
1. Component Function Executes
   ↓
2. useState Hooks Execute (Synchronous)
   - Return current state or initial state
   ↓
3. useSelector Hooks Execute (Synchronous)
   - Read from Redux store
   - Subscribe to store changes
   ↓
4. JSX Returned
   - Virtual DOM created
   ↓
5. React Commits to DOM
   - Real DOM updated
   ↓
6. useEffect Callbacks Execute (Asynchronous)
   - Run after paint
   - Can trigger re-render
```

**Hook Rules**:
1. Only call hooks at top level
2. Only call hooks in React functions
3. Hooks must be called in same order every render

### 6.5 React Context Usage

**Multiple Context Providers**:

```javascript
<Provider store={reduxStore}>        // Redux Context
  <ToastProvider>                    // Toast Context
    <BreadcrumbsProvider>            // Breadcrumb Context
      <Router>                       // Router Context
        <App />
      </Router>
    </BreadcrumbsProvider>
  </ToastProvider>
</Provider>
```

**Context Access in Components**:

```javascript
// Redux Context
const cartData = useSelector(state => state.cartData);
const dispatch = useDispatch();

// Toast Context
const { addToast } = useToasts();

// Router Context
const history = useHistory();
const location = useLocation();
const { id } = useParams();

// Breadcrumb Context
<BreadcrumbsItem to="/">Home</BreadcrumbsItem>
```

**Context Performance**:
- Context changes trigger re-render of all consumers
- Redux uses subscription pattern for optimization
- Only components using changed state re-render

### 6.6 Event Handling in React

**Synthetic Events**:

```javascript
<button onClick={handleClick}>Add to Cart</button>
```

**React Event System**:

```
User Clicks Button
         ↓
┌────────────────────────────────────────┐
│  Browser Native Event                  │
│  - DOM event triggered                 │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  React Event Delegation                │
│  - React listens at document level     │
│  - Single listener for all events      │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Synthetic Event Created               │
│  - Wraps native event                  │
│  - Cross-browser compatibility         │
│  - Event pooling for performance       │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Handler Function Called               │
│  - handleClick(syntheticEvent)         │
│  - Access event.target, etc.           │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  State Update (if any)                 │
│  - setState() called                   │
│  - Re-render scheduled                 │
└────────────────────────────────────────┘
```

**Event Pooling**:
- React reuses event objects for performance
- Event properties nullified after handler
- Use `event.persist()` to keep event

---

## 7. API Communication Architecture

### 7.1 API Endpoint Structure

**Base Configuration**:

```javascript
// env-config.js
window._env_ = {
  APP_BASE_URL: "http://localhost:8080",
  APP_API_VERSION: "/api/v1/",
  APP_MERCHANT: "DEFAULT"
};

// webService.js
const BASE_URL = window._env_.APP_BASE_URL + window._env_.APP_API_VERSION;
// Result: http://localhost:8080/api/v1/
```

**Endpoint Constants**:

```javascript
// constant.js
const Constant = {
  ACTION: {
    PRODUCTS: 'products/',
    PRODUCT: 'product/',
    CATEGORY: 'category/',
    CART: 'cart/',
    CUSTOMER: 'customer/',
    AUTH: 'auth/',
    CHECKOUT: 'checkout',
    // ... more endpoints
  }
};
```

**Building API URLs**:

```javascript
// Example: Fetch products
let action = constant.ACTION.PRODUCTS 
  + '?store=' + window._env_.APP_MERCHANT 
  + '&lang=' + currentLanguageCode 
  + '&category=' + categoryID;

// Result: products/?store=DEFAULT&lang=en&category=electronics

// Full URL: http://localhost:8080/api/v1/products/?store=DEFAULT&lang=en&category=electronics
```

### 7.2 Request/Response Flow

**Complete HTTP Request Lifecycle**:

```
Component Initiates Request
         ↓
┌────────────────────────────────────────┐
│  WebService Method Called              │
│  WebService.get(action)                │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Axios Request Created                 │
│  axios.get(BASE_URL + action)          │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Request Interceptor                   │
│  - Add baseURL                         │
│  - Get token from localStorage         │
│  - Add Authorization header            │
│  - Return modified config              │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  HTTP Request Sent                     │
│  GET /api/v1/products?...              │
│  Headers:                              │
│    Authorization: Bearer {token}       │
│    Content-Type: application/json      │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Network Layer                         │
│  - DNS resolution                      │
│  - TCP connection                      │
│  - TLS handshake (if HTTPS)            │
│  - HTTP request sent                   │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Backend Server                        │
│  - Receives request                    │
│  - Validates JWT token                 │
│  - Routes to controller                │
│  - Executes business logic             │
│  - Queries database                    │
│  - Formats response                    │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  HTTP Response Sent                    │
│  Status: 200 OK                        │
│  Headers:                              │
│    Content-Type: application/json      │
│  Body: { products: [...], total: 45 }  │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Response Interceptor                  │
│  - Check status code                   │
│  - Handle errors (401, 404, 500)       │
│  - Return response or reject           │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  WebService Returns Data               │
│  return response.data                  │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Component Receives Data               │
│  let response = await WebService.get() │
│  setProducts(response.products)        │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  State Updated → Re-render             │
└────────────────────────────────────────┘
```

### 7.3 Error Handling Strategy

**Multi-Layer Error Handling**:

```
Error Occurs
         ↓
┌────────────────────────────────────────┐
│  Layer 1: Axios Response Interceptor   │
│  - Catches HTTP errors                 │
│  - Logs error                          │
│  - Returns Promise.reject(error)       │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Layer 2: Action Creator Try/Catch     │
│  try {                                 │
│    await WebService.get(action);       │
│  } catch (error) {                     │
│    dispatch(setLoader(false));         │
│    // Handle error                     │
│  }                                     │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Layer 3: Component Error Boundary     │
│  - Catches rendering errors            │
│  - Shows fallback UI                   │
│  - Prevents app crash                  │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  User Feedback                         │
│  - Toast notification                  │
│  - Error message displayed             │
│  - Loader hidden                       │
└────────────────────────────────────────┘
```

---

## 8. Summary: Key Technical Concepts

### 8.1 React Core Concepts Used

1. **Component-Based Architecture**: Reusable UI building blocks
2. **Virtual DOM**: Efficient UI updates through diffing
3. **JSX**: JavaScript XML syntax for component templates
4. **Hooks**: State and lifecycle in functional components
5. **Context API**: Prop drilling avoidance
6. **Lazy Loading**: Code splitting for performance
7. **Suspense**: Loading state management
8. **Synthetic Events**: Cross-browser event handling

### 8.2 State Management Flow

1. **Redux Store**: Single source of truth
2. **Actions**: Describe what happened
3. **Reducers**: Specify how state changes
4. **Middleware**: Async operations (Thunk)
5. **Selectors**: Read state from store
6. **Dispatch**: Trigger state changes
7. **Persistence**: LocalStorage integration

### 8.3 Routing Strategy

1. **Client-Side Routing**: No page reloads
2. **Dynamic Routes**: Parameter-based navigation
3. **Lazy Loading**: On-demand component loading
4. **History API**: Browser history management
5. **Programmatic Navigation**: history.push()

### 8.4 Performance Optimizations

1. **Code Splitting**: Smaller initial bundle
2. **Lazy Loading**: On-demand loading
3. **State Persistence**: Faster subsequent loads
4. **Virtual DOM**: Minimal DOM updates
5. **Event Delegation**: Single event listener

### 8.5 Data Flow Pattern

```
User Action → Event Handler → Redux Action → API Call → 
Backend Processing → Response → Redux State Update → 
Component Re-render → DOM Update → User Sees Change
```

This architecture ensures:
- **Predictable State**: Unidirectional data flow
- **Maintainability**: Clear separation of concerns
- **Performance**: Optimized rendering and loading
- **Scalability**: Modular component structure
- **Developer Experience**: Redux DevTools, hot reloading



---

## 9. Address Management Feature (New Implementation)

### 9.1 Feature Overview

The address management system allows authenticated customers to manage multiple billing and delivery addresses through a complete CRUD interface integrated into the My Account page.

### 9.2 Architecture

**Component Hierarchy**:

```
MyAccount Page
  └── AddressManagement Component (Redux Connected)
        ├── AddressList Component (Billing Addresses)
        │     ├── AddressCard Components (Display)
        │     ├── AddressForm Component (Add/Edit Modal)
        │     └── SweetAlert (Delete Confirmation)
        └── AddressList Component (Delivery Addresses)
              ├── AddressCard Components (Display)
              ├── AddressForm Component (Add/Edit Modal)
              └── SweetAlert (Delete Confirmation)
```

### 9.3 Request Flow: Add New Address

```
User Clicks "Add New Address" Button
         ↓
┌────────────────────────────────────────┐
│  AddressList Component                 │
│  - setShowForm(true)                   │
│  - setEditingAddress(null)             │
│  - Local state updated                 │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  AddressForm Modal Renders             │
│  - Empty form displayed                │
│  - addressType set (BILLING/DELIVERY)  │
│  - React Hook Form initialized         │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  User Fills Form Fields                │
│  - Real-time validation                │
│  - Country selection triggers          │
│    state/province fetch                │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  User Clicks "Save Address"            │
│  - Form validation runs                │
│  - handleFormSubmit() executes         │
│  - setIsSubmitting(true)               │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  AddressList.handleAdd() Called        │
│  - Receives form data                  │
│  - Calls onAdd prop function           │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  AddressManagement.handleAddAddress()  │
│  - dispatch(createAddress(data, toast))│
│  - Redux action dispatched             │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Redux Action: createAddress()         │
│  - dispatch(setLoader(true))           │
│  - Prepare address data object         │
│  - Add billingAddress flag             │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  API Call via WebService               │
│  POST /api/v1/auth/customer/address    │
│  Headers: { Authorization: Bearer ... }│
│  Body: {                               │
│    firstName, lastName, address,       │
│    city, country, zone, postalCode,    │
│    phone, billingAddress: true/false   │
│  }                                     │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Backend Processing                    │
│  - Validates JWT token                 │
│  - Validates address data              │
│  - Creates address record              │
│  - Links to customer                   │
│  - Returns created address with ID     │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Response Received                     │
│  {                                     │
│    id: 123,                            │
│    firstName: "John",                  │
│    lastName: "Doe",                    │
│    address: "123 Main St",             │
│    city: "New York",                   │
│    country: "US",                      │
│    zone: "NY",                         │
│    postalCode: "10001",                │
│    phone: "1234567890",                │
│    billingAddress: true                │
│  }                                     │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Redux Action Continues                │
│  - dispatch({                          │
│      type: ADD_ADDRESS,                │
│      payload: response                 │
│    })                                  │
│  - dispatch(setLoader(false))          │
│  - addToast("Address added", success)  │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Redux Reducer: addressReducer         │
│  - Receives ADD_ADDRESS action         │
│  - Returns new state:                  │
│    {                                   │
│      addresses: [                      │
│        ...state.addresses,             │
│        action.payload                  │
│      ]                                 │
│    }                                   │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Redux Store Updated                   │
│  - addressData.addresses array updated │
│  - All connected components notified   │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  AddressManagement Re-renders          │
│  - dispatch(getAddresses())            │
│  - Fetches fresh data from server      │
│  - Ensures sync with backend           │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  AddressList Re-renders                │
│  - useSelector detects state change    │
│  - Filters addresses by type           │
│  - Maps to AddressCard components      │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  New AddressCard Rendered              │
│  - Displays new address                │
│  - Edit and delete buttons available   │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Form Modal Closes                     │
│  - setShowForm(false)                  │
│  - setEditingAddress(null)             │
│  - setIsSubmitting(false)              │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Toast Notification Appears            │
│  - "Address added successfully"        │
│  - Auto-dismiss after 3 seconds        │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  User Sees Updated Address List        │
│  - New address card visible            │
│  - Properly categorized                │
│  - Ready for edit/delete               │
└────────────────────────────────────────┘
```

### 9.4 Request Flow: Edit Address

```
User Clicks Edit Icon on Address Card
         ↓
┌────────────────────────────────────────┐
│  AddressCard.onEdit() Called           │
│  - Passes address object to parent     │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  AddressList.handleEdit()              │
│  - setEditingAddress(address)          │
│  - setShowForm(true)                   │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  AddressForm Modal Opens               │
│  - Receives address prop               │
│  - useEffect detects address           │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Form Pre-population                   │
│  - setValue('firstName', address.firstName)│
│  - setValue('lastName', address.lastName)  │
│  - setValue('address', address.address)    │
│  - ... all fields populated            │
│  - getState(address.country) called    │
│  - setTimeout for state selection      │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  User Modifies Fields                  │
│  - Form validation active              │
│  - Changes tracked by React Hook Form  │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  User Clicks "Save Address"            │
│  - handleFormSubmit() executes         │
│  - Detects editingAddress exists       │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  AddressList.handleFormSubmit()        │
│  - Calls onUpdate(id, data)            │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Redux Action: updateAddress()         │
│  - dispatch(setLoader(true))           │
│  PUT /api/v1/auth/customer/address/{id}│
│  - Sends updated address data          │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Backend Updates Record                │
│  - Validates ownership                 │
│  - Updates database                    │
│  - Returns updated address             │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Redux Reducer: UPDATE_ADDRESS         │
│  - Maps through addresses array        │
│  - Replaces matching address by ID     │
│  - Returns new state                   │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Components Re-render                  │
│  - Updated address displayed           │
│  - Modal closes                        │
│  - Toast notification shown            │
└────────────────────────────────────────┘
```

### 9.5 Request Flow: Delete Address

```
User Clicks Delete Icon
         ↓
┌────────────────────────────────────────┐
│  AddressCard.onDelete() Called         │
│  - Passes address ID to parent         │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  AddressList.handleDeleteClick()       │
│  - setDeleteId(id)                     │
│  - Triggers SweetAlert render          │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  SweetAlert Confirmation Dialog        │
│  - "Are you sure?"                     │
│  - "Yes, delete it!" button            │
│  - Cancel button                       │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  User Clicks "Yes, delete it!"         │
│  - handleDeleteConfirm() executes      │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Redux Action: deleteAddress()         │
│  - dispatch(setLoader(true))           │
│  DELETE /api/v1/auth/customer/address/{id}│
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Backend Deletes Record                │
│  - Validates ownership                 │
│  - Soft/hard delete from database      │
│  - Returns success response            │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Redux Reducer: DELETE_ADDRESS         │
│  - Filters addresses array             │
│  - Removes address with matching ID    │
│  - Returns new state                   │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Components Re-render                  │
│  - Address card removed from UI        │
│  - Confirmation dialog closes          │
│  - Toast notification shown            │
└────────────────────────────────────────┘
```

### 9.6 React Component Lifecycle

**AddressManagement Component**:

```
Component Mounts
         ↓
┌────────────────────────────────────────┐
│  useEffect Hook Executes               │
│  - getAddresses() dispatched           │
│  - getCountry(language) dispatched     │
│  - Dependencies: [getAddresses,        │
│                   getCountry, language]│
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  API Calls Initiated                   │
│  - GET /api/v1/auth/customer/addresses │
│  - GET /api/v1/country?store=...       │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Redux State Updated                   │
│  - addressData.addresses populated     │
│  - userData.country populated          │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Component Re-renders                  │
│  - Props updated from Redux            │
│  - AddressList components receive data │
└────────────────────────────────────────┘
```

**AddressForm Component**:

```
Component Mounts (Modal Opens)
         ↓
┌────────────────────────────────────────┐
│  React Hook Form Initialized           │
│  - useForm() hook creates form instance│
│  - register() functions created        │
│  - errors object available             │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  useEffect for Pre-population          │
│  - Checks if address prop exists       │
│  - If yes, setValue() for each field   │
│  - getState(country) called            │
│  - setTimeout for state selection      │
│  - Dependencies: [address, setValue,   │
│                   getState]            │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Form Rendered                         │
│  - All fields displayed                │
│  - Validation rules attached           │
│  - Country/state dropdowns populated   │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  User Interaction                      │
│  - onChange events trigger validation  │
│  - errors object updated in real-time  │
│  - Country change triggers getState()  │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Form Submission                       │
│  - handleSubmit() validates all fields │
│  - If valid, handleFormSubmit() called │
│  - If invalid, errors displayed        │
└────────────────────────────────────────┘
```

### 9.7 State Management Pattern

**Redux Store Structure**:

```javascript
{
  addressData: {
    addresses: [
      {
        id: 1,
        firstName: "John",
        lastName: "Doe",
        company: "Acme Inc",
        address: "123 Main St",
        city: "New York",
        country: "US",
        zone: "NY",
        stateProvince: "NY",
        postalCode: "10001",
        phone: "1234567890",
        billingAddress: true  // true = BILLING, false = DELIVERY
      }
    ]
  }
}
```

**Action Types**:
- `SET_ADDRESSES` - Replace entire addresses array
- `ADD_ADDRESS` - Append new address to array
- `UPDATE_ADDRESS` - Replace address by ID
- `DELETE_ADDRESS` - Remove address by ID

**Reducer Logic**:

```javascript
const addressReducer = (state = initState, action) => {
  switch(action.type) {
    case SET_ADDRESSES:
      return { ...state, addresses: action.payload || [] };
    
    case ADD_ADDRESS:
      return { ...state, addresses: [...state.addresses, action.payload] };
    
    case UPDATE_ADDRESS:
      return {
        ...state,
        addresses: state.addresses.map(addr => 
          addr.id === action.payload.id ? action.payload : addr
        )
      };
    
    case DELETE_ADDRESS:
      return {
        ...state,
        addresses: state.addresses.filter(addr => addr.id !== action.payload)
      };
    
    default:
      return state;
  }
};
```

### 9.8 Form Validation

**Validation Rules**:

```javascript
{
  firstName: { required: "First name is required" },
  lastName: { required: "Last name is required" },
  address: { required: "Address is required" },
  city: { required: "City is required" },
  country: { required: "Country is required" },
  stateProvince: { required: "State is required" },
  postalCode: { required: "Postal code is required" },
  phone: { 
    required: "Phone is required",
    minLength: { value: 10, message: "Enter a 10-digit number" }
  }
}
```

**Validation Flow**:

```
User Types in Field
         ↓
onChange Event Triggered
         ↓
React Hook Form Validates
         ↓
errors Object Updated
         ↓
Error Message Displayed (if invalid)
         ↓
Submit Button Enabled/Disabled Based on Form Validity
```

### 9.9 Performance Considerations

**Optimizations Implemented**:

1. **Component Reusability**:
   - AddressForm used for both add and edit
   - AddressCard reused for all addresses
   - Reduces code duplication

2. **Conditional Rendering**:
   - Form modal only rendered when showForm is true
   - Empty state only shown when no addresses
   - Reduces unnecessary DOM nodes

3. **Proper React Keys**:
   - Each AddressCard has unique key (address.id)
   - Enables efficient reconciliation

4. **useEffect Dependencies**:
   - Properly specified to avoid unnecessary re-renders
   - Functions memoized where needed

5. **API Call Optimization**:
   - Single getAddresses() call on mount
   - Refresh only after successful CRUD operations
   - No polling or unnecessary requests

### 9.10 Error Handling

**Error Scenarios Handled**:

1. **API Errors**:
   ```javascript
   try {
     await WebService.post(action, data);
   } catch (error) {
     dispatch(setLoader(false));
     addToast("Failed to add address", { appearance: "error" });
     throw error;
   }
   ```

2. **Validation Errors**:
   - React Hook Form displays field-level errors
   - Submit button disabled until form valid

3. **Network Errors**:
   - Axios interceptor handles 401, 404, 500
   - User-friendly error messages via toast

4. **Empty States**:
   - "No addresses found" message displayed
   - Encourages user to add first address

### 9.11 Security Implementation

**Authentication**:
- All API calls require JWT token
- Token automatically added by Axios interceptor
- Unauthorized requests redirect to login

**Authorization**:
- Backend validates address ownership
- Users can only CRUD their own addresses
- Address ID validated on server

**Data Validation**:
- Client-side validation (React Hook Form)
- Server-side validation (backend)
- Prevents malicious data submission

### 9.12 Accessibility Features

**Keyboard Navigation**:
- All buttons focusable
- Tab order logical
- Enter key submits forms
- Escape key closes modals

**Screen Reader Support**:
- Semantic HTML (button, form, label)
- Proper label associations
- ARIA labels where needed

**Visual Feedback**:
- Focus indicators on interactive elements
- Loading states clearly indicated
- Error messages prominently displayed

### 9.13 Mobile Responsiveness

**Breakpoints**:
- Desktop: Grid layout (3 columns)
- Tablet: Grid layout (2 columns)
- Mobile: Single column layout

**Touch Optimization**:
- Larger touch targets (44x44px minimum)
- Swipe-friendly modals
- No hover-dependent interactions

**Modal Behavior**:
- Full-screen on mobile
- Scrollable content
- Easy to close (X button, overlay click)

### 9.14 Integration with Existing Features

**My Account Page**:
- Seamlessly integrated as section 6
- Follows existing accordion pattern
- Consistent styling with other sections

**Country/State Dropdowns**:
- Reuses existing Redux actions (getCountry, getState)
- Shares state with billing/delivery forms
- Consistent data source

**Toast Notifications**:
- Uses existing toast system
- Consistent messaging style
- Auto-dismiss behavior

**Loading Indicator**:
- Uses global loader (setLoader action)
- Consistent with rest of application
- Prevents duplicate submissions

This address management feature demonstrates a complete CRUD implementation following React/Redux best practices, with proper error handling, validation, and user experience considerations.
