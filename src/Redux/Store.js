import { configureStore } from "@reduxjs/toolkit";

import StoreDataSlice from './StoreDataSlice'
const Store = configureStore({
    reducer:{  
        storeData:StoreDataSlice,
    }
})

export default Store;
