// Redux-хранилище: что искали, что выбрали и в каком состоянии оба запроса.
import { configureStore, createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fetchPartWithAnalogues, fetchParts } from './api.js';

// createAsyncThunk сам создаёт действия pending, fulfilled и rejected для каждого запроса.
export const loadBrands = createAsyncThunk('search/loadBrands', (number) => fetchParts(number));
export const loadOffers = createAsyncThunk('search/loadOffers', (part) =>
  fetchPartWithAnalogues(part),
);

// status: idle (запроса не было), loading, succeeded или failed.
// requestId хранит последний запрос, чтобы отличать его от устаревших.
const emptyRequest = { status: 'idle', items: [], error: null, requestId: null };

const initialState = {
  query: '',
  selectedPart: null,
  brands: emptyRequest,
  offers: emptyRequest,
};

// Оба запроса ведут себя одинаково, поэтому их обработка вынесена в одну функцию.
// Учитывается только последний запрос: медленный старый ответ может прийти позже нового
// и не должен его затереть. onStart выполняет то, что отличается у каждого запроса.
function addRequestCases(builder, thunk, field, onStart) {
  builder
    .addCase(thunk.pending, (state, { meta }) => {
      state[field] = { status: 'loading', items: [], error: null, requestId: meta.requestId };
      onStart(state, meta.arg);
    })
    .addCase(thunk.fulfilled, (state, { meta, payload }) => {
      if (state[field].requestId !== meta.requestId) return;
      state[field].status = 'succeeded';
      state[field].items = payload;
    })
    .addCase(thunk.rejected, (state, { meta, error }) => {
      if (state[field].requestId !== meta.requestId) return;
      state[field].status = 'failed';
      state[field].error = error.message;
    });
}

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    // Сброс тоже отменяет запросы в пути: requestId становится null, и их ответы игнорируются.
    resetSearch: () => initialState,
  },
  extraReducers: (builder) => {
    // Новый поиск убирает старый выбор и таблицу, иначе они относились бы к другому артикулу.
    addRequestCases(builder, loadBrands, 'brands', (state, number) => {
      state.query = number;
      state.selectedPart = null;
      state.offers = emptyRequest;
    });
    addRequestCases(builder, loadOffers, 'offers', (state, part) => {
      state.selectedPart = part;
    });
  },
});

export const { resetSearch } = searchSlice.actions;

export const store = configureStore({
  reducer: { search: searchSlice.reducer },
});
