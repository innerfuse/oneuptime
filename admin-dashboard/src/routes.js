import pages from './pages';

const { Users, User, Projects, Project, Probes, AuditLogs } = pages;

export const groups = [
    {
        group: 'Products',
        visible: true,
        routes: [
            {
                title: 'Users',
                path: '/users',
                icon: 'customers',
                component: Users,
                visible: true,
                subRoutes: [
                    {
                        title: 'User',
                        path: '/users/:userId',
                        icon: 'customers',
                        component: User,
                        visible: true,
                        subRoutes: [],
                        index: 1,
                    },
                ],
                index: 1,
            },
            {
                title: 'Projects',
                path: '/projects',
                icon: 'projects',
                component: Projects,
                visible: true,
                subRoutes: [
                    {
                        title: 'Project',
                        path: '/projects/:projectId',
                        icon: 'projects',
                        component: Project,
                        visible: true,
                        subRoutes: [],
                        index: 1,
                    },
                ],
                index: 2,
            },
            {
                title: 'Probes',
                path: '/probes',
                icon: 'probes',
                component: Probes,
                visible: true,
                subRoutes: [],
                index: 3,
            },
            {
                title: 'Audit Logs',
                path: '/auditLogs',
                icon: 'auditLogs',
                component: AuditLogs,
                visible: true,
                subRoutes: [],
                index: 4,
            },
        ],
    },
];

const joinFn = (acc = [], curr) => {
    return acc.concat(curr);
};

export const allRoutes = groups
    .map(function merge(group) {
        const { routes } = group;
        const newRoutes = [];
        for (const route of routes) {
            newRoutes.push(route);
            const tempRoute = { ...route };
            tempRoute.path = '/admin' + route.path;
            newRoutes.push(tempRoute);
        }
        const subRoutes = newRoutes
            .map(route => {
                const newSubRoutes = [];
                for (const subRoute of route.subRoutes) {
                    newSubRoutes.push(subRoute);
                    const tempRoute = { ...subRoute };
                    tempRoute.path = '/admin' + subRoute.path;
                    newSubRoutes.push(tempRoute);
                }
                return newSubRoutes;
            })
            .reduce(joinFn);
        return newRoutes.concat(subRoutes);
    })
    .reduce(joinFn);

export const getGroups = () => groups;

export default {
    groups,
    allRoutes,
};
