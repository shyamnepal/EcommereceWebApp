using MyApi.Endpoints;

namespace MyApi.Extensions;

public static class EndpointExtensions
{
    public static void MapApiEndpoints(this IEndpointRouteBuilder routes)
    {
        routes.MapAuthEndpoints();
        routes.MapProductEndpoints();
        routes.MapOrderEndpoints();
    }
}
