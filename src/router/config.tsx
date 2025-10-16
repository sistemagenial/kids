
import type { RouteObject } from 'react-router-dom';
import { lazy } from 'react';

// Lazy loading dos componentes
const HomePage = lazy(() => import('../pages/home/page'));
const InicioPage = lazy(() => import('../pages/inicio/page'));
const LoginPage = lazy(() => import('../pages/login/page'));
const BoasVindasPage = lazy(() => import('../pages/boas-vindas/page'));
const HistoriasPage = lazy(() => import('../pages/historias/page'));
const StoryPage = lazy(() => import('../pages/story/page'));
const VideosPage = lazy(() => import('../pages/videos/page'));
const VideoPage = lazy(() => import('../pages/video/page'));
const ComoNavegarPage = lazy(() => import('../pages/como-navegar/page'));
const ComprarLicencaPage = lazy(() => import('../pages/comprar-licenca/page'));
const RenovarPage = lazy(() => import('../pages/renovar/page'));
const AdminPage = lazy(() => import('../pages/admin/page'));
const GerenciarDispositivosPage = lazy(() => import('../pages/gerenciar-dispositivos/page'));
const NotFoundPage = lazy(() => import('../pages/NotFound'));

const routes: RouteObject[] = [
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/home',
    element: <HomePage />,
  },
  {
    path: '/inicio',
    element: <InicioPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/boas-vindas',
    element: <BoasVindasPage />,
  },
  {
    path: '/historias',
    element: <HistoriasPage />,
  },
  {
    path: '/story/:id',
    element: <StoryPage />,
  },
  {
    path: '/videos',
    element: <VideosPage />,
  },
  {
    path: '/video/:id',
    element: <VideoPage />,
  },
  {
    path: '/como-navegar',
    element: <ComoNavegarPage />,
  },
  {
    path: '/comprar-licenca',
    element: <ComprarLicencaPage />,
  },
  {
    path: '/renovar',
    element: <RenovarPage />,
  },
  {
    path: '/admin',
    element: <AdminPage />,
  },
  {
    path: '/gerenciar-dispositivos',
    element: <GerenciarDispositivosPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
];

export default routes;
