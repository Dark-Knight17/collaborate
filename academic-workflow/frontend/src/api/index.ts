import { authApi } from './auth';
import { projectsApi } from './projects';
import { tasksApi } from './tasks';
import { coursesApi } from './courses';
import { miscApi } from './misc';

export const api = {
  ...authApi,
  ...projectsApi,
  ...tasksApi,
  ...coursesApi,
  ...miscApi,
};

export default api;
